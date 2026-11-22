# Event OS on Google Cloud Run (M5-01)

Deploy infrastructure for the API (`apps/api`). **Nothing here has been executed by the
repo tooling** — every command below is run once, by a human, with a `gcloud` session that
has Owner/Editor rights on the project. Placeholders are marked `REPLACE_…`.

```
Cloudflare DNS ──► Cloud Run domain mapping ──► Cloud Run service (port 4000)
                                                   │  ├─ unix socket ─► Cloud SQL PG16 (private IP)
                                                   │  └─ VPC connector ─► Memorystore Redis
                                                   └─ Secret Manager (env refs only)
Cloud Run Job `eventos-migrate-<env>`  ── prisma migrate deploy, before every deploy
Cloud Run Job `eventos-seed-prod`      ── one-off: tenant + owner user, no demo data
```

| Item | Value |
| --- | --- |
| Project / region | `wedecorenquries` / `asia-south1` |
| Image registry | `asia-south1-docker.pkg.dev/wedecorenquries/eventos` |
| Services | `eventos-api-staging` (min 0), `eventos-api-prod` (min 1); port 4000, concurrency 40 |
| Cloud SQL | `eventos-pg` (PG16, private IP), databases `eventos_staging`, `eventos_prod` |
| Redis | Memorystore `eventos-redis` (Basic, 1 GB); staging uses db `/1`, prod `/0` |
| VPC connector | `eventos-connector` |
| Runtime service account | `eventos-api@wedecorenquries.iam.gserviceaccount.com` |
| Deployer service account (CI) | `eventos-deployer@wedecorenquries.iam.gserviceaccount.com` |
| Hostnames | `api.wedecorevents.com` → prod, `api-staging.wedecorevents.com` → staging |

> Deviation from the prompt: the service and migration job are named per environment
> (`eventos-api-staging` / `eventos-api-prod`, `eventos-migrate-<env>`) because both
> environments live in one project and region.

Files: `deploy.sh`, `rollback.sh`, `cloudrun.staging.yaml`, `cloudrun.prod.yaml`; CI is
`.github/workflows/deploy.yml`.

## One-time setup (run in order)

### 0. Shell variables

```bash
export PROJECT_ID=wedecorenquries
export REGION=asia-south1
export PROJECT_NUMBER="$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')"
export RUNTIME_SA="eventos-api@${PROJECT_ID}.iam.gserviceaccount.com"
export DEPLOYER_SA="eventos-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
export SQL_CONNECTION="${PROJECT_ID}:${REGION}:eventos-pg"
export GITHUB_REPO="REPLACE_OWNER/REPLACE_REPO"   # e.g. we-decor/EventOS
gcloud config set project "$PROJECT_ID"
```

### 1. Enable APIs

```bash
gcloud services enable \
  run.googleapis.com artifactregistry.googleapis.com sqladmin.googleapis.com \
  redis.googleapis.com vpcaccess.googleapis.com compute.googleapis.com \
  servicenetworking.googleapis.com secretmanager.googleapis.com \
  iamcredentials.googleapis.com sts.googleapis.com identitytoolkit.googleapis.com
```

### 2. Artifact Registry

```bash
gcloud artifacts repositories create eventos \
  --repository-format=docker --location="$REGION" \
  --description="Event OS images"
```

### 3. Runtime service account

```bash
gcloud iam service-accounts create eventos-api --display-name="Event OS API runtime"

# Cloud SQL connection (unix socket) + Firebase ID-token verification (ADC, no JSON key).
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/cloudsql.client"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${RUNTIME_SA}" --role="roles/firebaseauth.viewer"
# Secret Accessor is granted per secret in step 6 — never project-wide.
```

### 4. Cloud SQL (PostgreSQL 16, private IP, backups + 7-day PITR)

```bash
# Private services access (one-time per VPC).
gcloud compute addresses create google-managed-services-default \
  --global --purpose=VPC_PEERING --prefix-length=16 --network=default
gcloud services vpc-peerings connect \
  --service=servicenetworking.googleapis.com \
  --ranges=google-managed-services-default --network=default

gcloud sql instances create eventos-pg \
  --database-version=POSTGRES_16 --edition=ENTERPRISE \
  --tier=db-custom-1-3840 --region="$REGION" \
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

### 5. Memorystore Redis + Serverless VPC Access connector

```bash
gcloud redis instances create eventos-redis \
  --tier=basic --size=1 --region="$REGION" \
  --redis-version=redis_7_0 --network=default

gcloud compute networks vpc-access connectors create eventos-connector \
  --region="$REGION" --network=default --range=10.8.0.0/28 \
  --min-instances=2 --max-instances=3

export REDIS_HOST="$(gcloud redis instances describe eventos-redis --region=$REGION --format='value(host)')"
```

Redis holds throttling counters, login lockout state and the Enquiries delivery ledger.
Basic tier has no persistence/failover; losing it is non-fatal (the API fails open on
the ledger and rebuilds counters).

### 6. Secret Manager

Secrets are created once; deploys only reference `:latest`.

```bash
mk_secret() { # name, value (read from stdin)
  gcloud secrets create "$1" --replication-policy=automatic --data-file=-
}

for ENV in staging prod; do
  DB_VAR=$([ "$ENV" = prod ] && echo "$PROD_DB_PASSWORD" || echo "$STAGING_DB_PASSWORD")
  REDIS_DB=$([ "$ENV" = prod ] && echo 0 || echo 1)
  openssl rand -base64 48 | tr -d '\n' | mk_secret "eventos-${ENV}-jwt-secret"
  printf 'postgresql://eventos_%s:%s@localhost/eventos_%s?host=/cloudsql/%s' \
    "$ENV" "$DB_VAR" "$ENV" "$SQL_CONNECTION" | mk_secret "eventos-${ENV}-database-url"
  printf 'redis://%s:6379/%s' "$REDIS_HOST" "$REDIS_DB" | mk_secret "eventos-${ENV}-redis-url"
  # Blank (a single space) = Sentry disabled. Replace later with:
  #   printf '%s' 'https://…@…ingest.sentry.io/…' | gcloud secrets versions add eventos-<env>-sentry-dsn --data-file=-
  printf ' ' | mk_secret "eventos-${ENV}-sentry-dsn"
done

# Shared with the Enquiries app (see docs/integrations/enquiries-bridge-contract.md).
openssl rand -hex 32 | tr -d '\n' | mk_secret eventos-enquiries-feed-secret
# Read it once to hand to the Enquiries operator, then clear your terminal:
#   gcloud secrets versions access latest --secret=eventos-enquiries-feed-secret

# Least privilege: the runtime account reads only these secrets.
for S in \
  eventos-staging-jwt-secret eventos-staging-database-url eventos-staging-redis-url eventos-staging-sentry-dsn \
  eventos-prod-jwt-secret    eventos-prod-database-url    eventos-prod-redis-url    eventos-prod-sentry-dsn \
  eventos-enquiries-feed-secret; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${RUNTIME_SA}" --role="roles/secretmanager.secretAccessor"
done
```

### 7. GitHub Actions → Workload Identity Federation (no JSON keys)

```bash
gcloud iam service-accounts create eventos-deployer --display-name="Event OS GitHub deployer"

for ROLE in roles/run.admin roles/artifactregistry.writer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="$ROLE"
done
# Cloud Run deploys "act as" the runtime account.
gcloud iam service-accounts add-iam-policy-binding "$RUNTIME_SA" \
  --member="serviceAccount:${DEPLOYER_SA}" --role="roles/iam.serviceAccountUser"

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
  --service-account="$RUNTIME_SA" \
  --set-cloudsql-instances="$SQL_CONNECTION" \
  --vpc-connector=eventos-connector --vpc-egress=private-ranges-only \
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

## Rotating the feed secret

```bash
openssl rand -hex 32 | tr -d '\n' | gcloud secrets create eventos-enquiries-feed-secret-next --data-file=-
gcloud secrets add-iam-policy-binding eventos-enquiries-feed-secret-next \
  --member="serviceAccount:${RUNTIME_SA}" --role=roles/secretmanager.secretAccessor
# Accept both (current + next) on the live service:
gcloud run services update eventos-api-prod --region="$REGION" \
  --update-secrets=ENQUIRIES_FEED_SECRET_NEXT=eventos-enquiries-feed-secret-next:latest
# Give the new value to the Enquiries operator; once they sign with it, promote:
gcloud secrets versions add eventos-enquiries-feed-secret --data-file=<(gcloud secrets versions access latest --secret=eventos-enquiries-feed-secret-next)
gcloud run services update eventos-api-prod --region="$REGION" --remove-secrets=ENQUIRIES_FEED_SECRET_NEXT
```

(The next `deploy.sh` re-applies the YAML, which has no `_NEXT` entry, so finish the
rotation before deploying again.) Rotate `JWT_SECRET` by adding a secret version and
redeploying; it invalidates active sessions.

## Known limitations

- **Uploads are not durable.** `STORAGE_PROVIDER=local` writes to `/tmp` on Cloud Run
  (ephemeral, per instance). Move to S3-compatible storage (`STORAGE_PROVIDER=s3`)
  before relying on document uploads in production.
- Email and AI providers are `none` in these definitions; enable them via the YAML when
  provisioned.
