# Event OS on Google Cloud Run (M5-01)

Deploy infrastructure for the API (`apps/api`). **Nothing here has been executed by the
repo tooling** — every command below is run once, by a human, with a `gcloud` session that
has Owner/Editor rights on the project. Placeholders are marked `REPLACE_…`.

```
Cloudflare DNS ──► Cloud Run domain mapping ──► Cloud Run service (port 4000)
                                                   │  ├─ unix socket ─► Cloud SQL PG16 (db-f1-micro, private IP)
                                                   │  └─ Direct VPC egress ─► Cloud SQL private IP
                                                   └─ Secret Manager (env refs only)
Cloud Run Job `eventos-migrate-<env>`  ── prisma migrate deploy, before every deploy
Cloud Run Job `eventos-seed-prod`      ── one-off: tenant + owner user, no demo data
```

| Item | Value |
| --- | --- |
| Project / region | `wedecorenquries` / `asia-south1` |
| Image registry | `asia-south1-docker.pkg.dev/wedecorenquries/eventos` |
| Services | `eventos-api-staging` and `eventos-api-prod`: min 0, **max 1** instance; port 4000, concurrency 40, 512Mi, CPU only during requests |
| Cloud SQL | `eventos-pg` (PG16, `db-f1-micro`, private IP), databases `eventos_staging`, `eventos_prod` |
| Redis | **None** (optional; set `REDIS_URL` to re-add — see [Re-adding Redis](#re-adding-redis-optional)) |
| VPC | Direct VPC egress on `default` network / `default` subnet (no Serverless VPC connector) |
| Runtime service accounts | `eventos-api-staging@…` and `eventos-api-prod@…` (split least privilege — each env accesses only its own secrets/bucket) |
| Deployer service account (CI) | `eventos-deployer@wedecorenquries.iam.gserviceaccount.com` |
| Hostnames | `api.wedecorevents.com` → prod, `api-staging.wedecorevents.com` → staging |
| Feed secrets | `eventos-staging-enquiries-feed-secret` / `eventos-prod-enquiries-feed-secret` (never shared across envs) |

> Deviation from the prompt: the service, migration job, and runtime service account
> are named per environment (`eventos-api-staging` / `eventos-api-prod`,
> `eventos-migrate-<env>`, `eventos-api-<env>@…`) because both environments live in
> one project and region.

Files: `deploy.sh`, `rollback.sh`, `cloudrun.staging.yaml`, `cloudrun.prod.yaml`; CI is
`.github/workflows/deploy.yml`.

## One-time setup (run in order)

### 0. Shell variables

```bash
export PROJECT_ID=wedecorenquries
export REGION=asia-south1
export PROJECT_NUMBER="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')"
export RUNTIME_SA_STAGING="eventos-api-staging@${PROJECT_ID}.iam.gserviceaccount.com"
export RUNTIME_SA_PROD="eventos-api-prod@${PROJECT_ID}.iam.gserviceaccount.com"
export DEPLOYER_SA="eventos-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
export SQL_CONNECTION="${PROJECT_ID}:${REGION}:eventos-pg"
export GITHUB_REPO="REPLACE_OWNER/REPLACE_REPO"   # e.g. wedecor/EventOS
gcloud config set project "$PROJECT_ID"
```

### 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com \
  compute.googleapis.com servicenetworking.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com identitytoolkit.googleapis.com \
  storage.googleapis.com billingbudgets.googleapis.com
```

### 2. Artifact Registry

```bash
gcloud artifacts repositories create eventos \
  --repository-format=docker --location="$REGION" \
  --description="Event OS images"
```

### 3. Runtime service accounts (one per environment)

Staging and production **do not** share a runtime SA. Each account can read only its own
Secret Manager secrets and (later) its own GCS bucket.

```bash
gcloud iam service-accounts create eventos-api-staging \
  --display-name="Event OS API runtime (staging)"
gcloud iam service-accounts create eventos-api-prod \
  --display-name="Event OS API runtime (prod)"

# Cloud SQL unix socket + Firebase ID-token verification (ADC, no JSON key).
for SA in "$RUNTIME_SA_STAGING" "$RUNTIME_SA_PROD"; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" --role="roles/cloudsql.client"
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${SA}" --role="roles/firebaseauth.viewer"
done
# Secret Accessor is granted per secret in step 6 — never project-wide.
```

### 4. Cloud SQL (PostgreSQL 16, db-f1-micro, private IP, backups + 7-day PITR)

```bash
# Private services access (one-time per VPC).
gcloud compute addresses create google-managed-services-default \
  --global --purpose=VPC_PEERING --prefix-length=16 --network=default
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default --network=default

gcloud sql instances create eventos-pg \
  --database-version=POSTGRES_16 --edition=ENTERPRISE \
  --tier=db-f1-micro --region="$REGION" \
  --network=default --no-assign-ip \
  --availability-type=zonal \
  --storage-type=SSD --storage-size=20GB --storage-auto-increase \
  --backup-start-time=21:00 --retained-backups-count=30 \
  --enable-point-in-time-recovery --retained-transaction-log-days=7 \
  --deletion-protection

gcloud sql databases create eventos_staging --instance=eventos-pg
gcloud sql databases create eventos_prod    --instance=eventos-pg

# One login per database. Hex passwords need no URL-encoding in DATABASE_URL.
export STAGING_DB_PASSWORD="$(openssl rand -hex 24)"
export PROD_DB_PASSWORD="$(openssl rand -hex 24)"
gcloud sql users create eventos_staging --instance=eventos-pg --password="$STAGING_DB_PASSWORD"
gcloud sql users create eventos_prod    --instance=eventos-pg --password="$PROD_DB_PASSWORD"
```

Backup time `21:00` UTC is 02:30 IST (low traffic). Grant each login access to its own
database only: connect once with `gcloud sql connect eventos-pg --user=postgres` and run
`GRANT ALL ON DATABASE eventos_prod TO eventos_prod;` (and the staging equivalent, plus
`GRANT ALL ON SCHEMA public TO <login>;` after `\c <db>`). Prisma needs to create tables in
`public`.

`db-f1-micro` is shared-core with ~25 `max_connections` and no SLA. The API therefore caps
its own Prisma/pg pool at **5 connections** (`connection_limit=5&pool_timeout=20` is
appended to `DATABASE_URL` when absent — the secret itself is unchanged), leaving headroom
for the migrate/seed jobs, admin sessions and Cloud SQL's reserved slots.

### 5. Direct VPC egress (replaces the Serverless VPC connector and Memorystore)

Cloud Run reaches the Cloud SQL private IP through **Direct VPC egress**: the service and
jobs attach straight to the `default` subnet. There is no connector (the connector's
always-on instances were the main idle cost) and no Redis.

- Services: `run.googleapis.com/network-interfaces: '[{"network":"default","subnetwork":"default"}]'`
  plus `vpc-access-egress: private-ranges-only` (only RFC 1918 traffic enters the VPC;
  GCS, Secret Manager and Firebase use the normal internet path).
- Jobs (`deploy.sh`): `--network=default --subnet=default --vpc-egress=private-ranges-only`.
- The `run.googleapis.com/cloudsql-instances` annotation is kept (unix-socket
  `DATABASE_URL`).

**Required IAM (one-time).** Direct VPC egress needs `roles/compute.networkUser` on the
subnet for the Cloud Run Service Agent and for whoever deploys (the CI deployer SA). It is
idempotent and safe to re-run:

```bash
export CLOUD_RUN_AGENT="service-${PROJECT_NUMBER}@serverless-robot-prod.iam.gserviceaccount.com"

for MEMBER in "serviceAccount:${CLOUD_RUN_AGENT}" "serviceAccount:${DEPLOYER_SA}"; do
  gcloud compute networks subnets add-iam-policy-binding default \
    --project="$PROJECT_ID" --region="$REGION" \
    --member="$MEMBER" --role="roles/compute.networkUser"
done
```

If a human deploys with `deploy.sh` instead of CI, grant the same role to that user. If a
revision fails with a subnet/IP error, check the subnet has free addresses
(`gcloud compute networks subnets describe default --region="$REGION"`).

### Scaling, cold starts and in-memory state

Both services run `minScale: 0`, `maxScale: 1`, 512Mi, CPU only while serving a request.

- **Why `maxScale=1`:** with no Redis, API rate limiting, login lockout/escalation and AI
  rate limits are held in memory per instance. A second instance would have its own
  counters and weaken brute-force protection. The Enquiries delivery-ID ledger is in
  Postgres (`integration_deliveries`, 7-day retention) and is unaffected.
- **Cold start:** after idle the first request takes a few seconds (container start,
  Prisma connect, migrations are not run at start). `startup-cpu-boost` is on. The
  `deploy.sh` smoke test retries for ~60 s to allow for it.
- **State resets** on every cold start/redeploy: throttle counters, active login
  lockouts and AI hourly counters start empty. Acceptable for a 2-user team; the HMAC feed
  signature, JWT auth and Postgres ledger are unaffected. The API logs a warning at
  startup when `REDIS_URL` is unset.
- `/health/ready` checks Postgres only and reports `redis: { status: "skipped" }`.

### Re-adding Redis (optional)

Redis is optional: setting `REDIS_URL` is the only switch, no code change. To re-add
Memorystore later:

1. Create the instance and read its host (`gcloud redis instances create …`; requires
   `redis.googleapis.com`). Direct VPC egress already reaches it (private range).
2. Store `redis://<host>:6379/<db>` in a secret (e.g. `eventos-<env>-redis-url`), grant the
   runtime SA `secretAccessor`, and add a `REDIS_URL` `secretKeyRef` env block to the
   service YAML.
3. Only then raise `maxScale` above 1 — shared throttling/lockout/AI limits then use Redis.

The Cloud Run YAMLs deliberately do **not** set `REDIS_URL` today.

### 6. Secret Manager

Secrets are created once; deploys only reference `:latest`. **Feed secrets are
per environment** — staging and prod never share an HMAC key.

```bash
mk_secret() { # name, value (read from stdin)
  gcloud secrets create "$1" --replication-policy=automatic --data-file=-
}

for ENV in staging prod; do
  DB_VAR=$([ "$ENV" = prod ] && echo "$PROD_DB_PASSWORD" || echo "$STAGING_DB_PASSWORD")
  openssl rand -base64 48 | tr -d '\n' | mk_secret "eventos-${ENV}-jwt-secret"
  printf 'postgresql://eventos_%s:%s@localhost/eventos_%s?host=/cloudsql/%s' \
    "$ENV" "$DB_VAR" "$ENV" "$SQL_CONNECTION" | mk_secret "eventos-${ENV}-database-url"
  # Blank (a single space) = Sentry disabled. Replace later with:
  #   printf '%s' 'https://…@…ingest.sentry.io/…' | gcloud secrets versions add eventos-<env>-sentry-dsn --data-file=-
  printf ' ' | mk_secret "eventos-${ENV}-sentry-dsn"
  # Enquiries feed HMAC (hand each value to the Enquiries sender for that env only).
  openssl rand -hex 32 | tr -d '\n' | mk_secret "eventos-${ENV}-enquiries-feed-secret"
done

# Least privilege: each runtime SA reads ONLY its own secrets.
grant_secret() {
  local secret="$1" sa="$2"
  gcloud secrets add-iam-policy-binding "$secret" \
    --member="serviceAccount:${sa}" --role="roles/secretmanager.secretAccessor"
}

for S in jwt-secret database-url sentry-dsn enquiries-feed-secret; do
  grant_secret "eventos-staging-${S}" "$RUNTIME_SA_STAGING"
  grant_secret "eventos-prod-${S}" "$RUNTIME_SA_PROD"
done

# Read once to hand to the Enquiries operator, then clear the terminal:
#   gcloud secrets versions access latest --secret=eventos-staging-enquiries-feed-secret
#   gcloud secrets versions access latest --secret=eventos-prod-enquiries-feed-secret
```

### 7. GitHub Actions → Workload Identity Federation (no JSON keys)

```bash
gcloud iam service-accounts create eventos-deployer --display-name="Event OS GitHub deployer"

for ROLE in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="$ROLE"
done
# Cloud Run deploys "act as" each environment's runtime account.
for SA in "$RUNTIME_SA_STAGING" "$RUNTIME_SA_PROD"; do
  gcloud iam service-accounts add-iam-policy-binding "$SA" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="roles/iam.serviceAccountUser"
done

gcloud iam workload-identity-pools create github \
  --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github-oidc \
  --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='${GITHUB_REPO}'"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/attribute.repository/${GITHUB_REPO}"

echo "projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github/providers/github-oidc"
```

In GitHub (**Settings → Environments**), create two environments and set these
**variables** (not secrets) on each:

| Environment | Protection | Variables |
| --- | --- | --- |
| `staging` | none | `GCP_WORKLOAD_IDENTITY_PROVIDER` (the `projects/…/providers/github-oidc` string above), `GCP_DEPLOYER_SERVICE_ACCOUNT` (`$DEPLOYER_SA`), `CORS_ORIGIN` (staging admin-portal HTTPS origin) |
| `production` | **Required reviewers** (and restrict to tags `v*`) | same three, with the production `CORS_ORIGIN` |

### 8. First deployment

CI does this on every push to `main` (staging) and every `v*` tag (production, after
reviewer approval). To run it by hand from a machine with Docker and `gcloud`
(`gcloud auth login`, `gcloud auth configure-docker asia-south1-docker.pkg.dev`):

```bash
CORS_ORIGIN=https://REPLACE_STAGING_ADMIN_ORIGIN infrastructure/gcp/deploy.sh staging
CORS_ORIGIN=https://REPLACE_PROD_ADMIN_ORIGIN    infrastructure/gcp/deploy.sh prod
```

`deploy.sh` builds and pushes the API and migrator images, runs the migration job and
waits for it, replaces the service definition, makes it publicly invokable (the API
authenticates callers itself), then smoke-tests `/health/ready` and confirms that an
unsigned feed request is refused with 401. A failed smoke test routes traffic back to the
previous revision. If your organisation policy forbids `allUsers` invoker, front the
service with an external HTTPS load balancer instead.

### 9. Seed production (once)

Creates the tenant "We Decor Events" and one owner user. No demo data.

```bash
export TAG=REPLACE_IMAGE_TAG_USED_BY_THE_LAST_DEPLOY   # printed by deploy.sh
gcloud run jobs deploy eventos-seed-prod \
  --region="$REGION" \
  --image="${REGION}-docker.pkg.dev/${PROJECT_ID}/eventos/eventos-migrator:${TAG}" \
  --service-account="$RUNTIME_SA_PROD" \
  --set-cloudsql-instances="$SQL_CONNECTION" \
  --network=default --subnet=default --vpc-egress=private-ranges-only \
  --set-secrets="DATABASE_URL=eventos-prod-database-url:latest" \
  --set-env-vars="NODE_ENV=production,SEED_OWNER_EMAIL=REPLACE_OWNER_EMAIL,SEED_OWNER_NAME=REPLACE_OWNER_NAME" \
  --command=node_modules/.bin/tsx --args=prisma/seed-prod.ts \
  --max-retries=0
gcloud run jobs execute eventos-seed-prod --region="$REGION" --wait
```

Idempotent. An owner password is optional (`SEED_OWNER_PASSWORD`, ≥ 12 chars, via a secret
reference only); the owner normally signs in through the Firebase bridge.

### 10. Custom domains (Cloud Run domain mapping + Cloudflare)

```bash
# Verify ownership of wedecorevents.com once (Search Console), as the deploying user.
gcloud beta run domain-mappings create --service=eventos-api-prod \
  --domain=api.wedecorevents.com --region="$REGION"
gcloud beta run domain-mappings create --service=eventos-api-staging \
  --domain=api-staging.wedecorevents.com --region="$REGION"
gcloud beta run domain-mappings describe --domain=api.wedecorevents.com --region="$REGION" \
  --format='value(status.resourceRecords)'
```

In Cloudflare create the records the command prints (normally `CNAME api` and
`CNAME api-staging` → `ghs.googlehosted.com`) with the proxy **off (DNS only, grey
cloud)**. Do not enable the orange-cloud proxy without first raising the API's trusted
proxy hop count (`apps/api/src/shared/http/trust-proxy.ts`, currently 1 = Google's
front end): with Cloudflare in front, per-IP throttling would see Cloudflare's address.
Certificate provisioning can take up to ~30 minutes. Domain mappings in `asia-south1`
are a preview feature; if unavailable, use an external HTTPS load balancer with a
serverless NEG.

### 11. Link Firebase users

After the seed, link each Enquiries Firebase user to an EventOS user with
`apps/api/scripts/link-firebase-users.ts` (dry run by default, `--apply` to write). See
the report's Operator Runbook.

## Rollback

```bash
infrastructure/gcp/rollback.sh prod            # newest previous Ready revision
infrastructure/gcp/rollback.sh prod eventos-api-prod-00012-abc   # explicit revision
```

This only moves traffic. Migrations are additive and **not** reverted; to undo a data
problem use Cloud SQL point-in-time recovery
(`infrastructure/disaster-recovery/disaster-recovery-runbook.md`, "Cloud SQL (GCP)").

## Rotating the feed secret (per environment)

Rotate staging and prod independently. Example for **prod** (swap `prod` → `staging`
and `$RUNTIME_SA_PROD` → `$RUNTIME_SA_STAGING` for staging):

```bash
ENV=prod
RUNTIME_SA="$RUNTIME_SA_PROD"
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create "eventos-${ENV}-enquiries-feed-secret-next" --data-file=-
gcloud secrets add-iam-policy-binding "eventos-${ENV}-enquiries-feed-secret-next" \
  --member="serviceAccount:${RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
# Accept both (current + next) on the live service:
gcloud run services update "eventos-api-${ENV}" --region="$REGION" \
  --update-secrets="ENQUIRIES_FEED_SECRET_NEXT=eventos-${ENV}-enquiries-feed-secret-next:latest"
# Give the new value to the Enquiries operator for that environment; once they sign with it, promote:
gcloud secrets versions add "eventos-${ENV}-enquiries-feed-secret" \
  --data-file=<(gcloud secrets versions access latest --secret="eventos-${ENV}-enquiries-feed-secret-next")
gcloud run services update "eventos-api-${ENV}" --region="$REGION" --remove-secrets=ENQUIRIES_FEED_SECRET_NEXT
```

(The next `deploy.sh` re-applies the YAML, which has no `_NEXT` entry, so finish the
rotation before deploying again.) Rotate `JWT_SECRET` by adding a secret version and
redeploying; it invalidates active sessions.

### 5b. Object storage (GCS — durable uploads)

Native GCS (`STORAGE_PROVIDER=gcs`) with Application Default Credentials on each
runtime SA — **no HMAC keys**. Prefer this over the S3-compatible XML API so
Cloud Run never needs long-lived access keys in Secret Manager.

```bash
for ENV in staging prod; do
  BUCKET="eventos-${ENV}-files"
  SA=$([ "$ENV" = prod ] && echo "$RUNTIME_SA_PROD" || echo "$RUNTIME_SA_STAGING")
  gcloud storage buckets create "gs://${BUCKET}" \
    --project="$PROJECT_ID" --location="$REGION" \
    --uniform-bucket-level-access \
    --public-access-prevention
  gcloud storage buckets update "gs://${BUCKET}" --versioning
  # Delete noncurrent object versions after 30 days.
  cat >"/tmp/${BUCKET}-lifecycle.json" <<'JSON'
{"rule":[{"action":{"type":"Delete"},"condition":{"isLive":false,"age":30}}]}
JSON
  gcloud storage buckets update "gs://${BUCKET}" \
    --lifecycle-file="/tmp/${BUCKET}-lifecycle.json"
  gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
    --member="serviceAccount:${SA}" --role="roles/storage.objectAdmin"
done
```

Cloud Run YAML already sets `STORAGE_PROVIDER=gcs` and `STORAGE_BUCKET=eventos-<env>-files`.
Env validation refuses `STORAGE_PROVIDER=local` in staging/production.

## Known limitations

- Email and AI providers are `none` in these definitions; enable them via the YAML when
  provisioned.
