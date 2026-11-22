# EventOS M5-01 — Deploy and Enquiries Bridge Report

Branch: `feature/m5-01-deploy-bridge` (not pushed). Spec:
`docs/cursor-prompts/M5-01-deploy-and-enquiries-bridge-EVENTOS.md`. Related ADR: ADR-019
(temporary Firebase/Enquiries bridge), ADR-016 (single tenant).

## 1. Summary

| Area | Delivered |
| --- | --- |
| Firebase login bridge | `POST /auth/firebase/exchange` — verifies the Firebase ID token (signature, expiry, revocation, audience, `iat` ≤ 5 min), issues the normal EventOS session; mobile clients also get the refresh token in the body |
| Identity linking | `ExternalIdentity` table, `POST/DELETE /admin/external-identities` (`users:write`), dry-run-by-default CSV script `scripts/link-firebase-users.ts` |
| Booking feed | `POST /integrations/enquiries/sync` (HMAC, replay ledger, ordered, transactional), operator `status` and `backfill-check`, finance-only `financials` read |
| Booking changes needed by the feed | `PATCH /bookings/:id` (409 `SOURCE_OWNED` for synced bookings), `GET /bookings/:id/functions`, new `EventFunction` entity |
| Hardening | Redis-backed throttling (120/min per user, 30/min per IP, feed 120/min, exchange 10/min), 1-hop trusted proxy, log redaction/phone masking, raw-body capture, `REDIS_URL` |
| Deploy infrastructure (written, **never executed**) | `infrastructure/gcp/{README.md,deploy.sh,rollback.sh,cloudrun.staging.yaml,cloudrun.prod.yaml}`, `.github/workflows/deploy.yml` (WIF), Dockerfile `migrator` target, `prisma/seed-prod.ts`, DR updates (Cloud SQL PITR + restore drill) |
| Docs | `docs/16-deployment-strategy.md`, `docs/integrations/enquiries-bridge-contract.md`, this report |

### Commits

| Hash | Message |
| --- | --- |
| `4228ffc` | feat(api): add M5-01 Prisma migration for Enquiries bridge |
| `d1a7744` | feat(api): add Firebase auth exchange bridge |
| `f3ef289` | feat(api): add external identity linking API and CSV script |
| `0b287f0` | feat(api): add Enquiries booking feed sync integration |
| `8329fbb` | feat(api): harden production throttling, proxy trust, and env for M5-01 |
| `59cf6ce` | feat(infra): add GCP Cloud Run deploy scripts and GitHub deploy workflow |
| (this commit) | docs(m5-01): add Enquiries bridge contract, deployment notes, and report |

### Verification

- `pnpm prisma:generate`, `pnpm lint`, `pnpm build`: clean.
- `AI_PROVIDER=test pnpm exec jest --forceExit`: **127 suites / 997 tests passing** (baseline before M5-01: 107 / 789).
- `pnpm openapi:export`: `openapi/openapi.v1.json` regenerated and committed; re-export shows **no drift**. Web types (`apps/web/src/types/api.generated.ts`) regenerated; `tsc --noEmit` clean.
- A scratch-database smoke run (create, update, stale, cancel, 10-way concurrent burst, cancel through the booking service) passed before commit 4; the scratch database has been dropped.
- **Not verified:** the Docker `migrator` image build and the Cloud Run deploy (no Docker daemon was running; no `gcloud` was executed by design). `deploy.sh` and `rollback.sh` are syntax-checked (`bash -n`) and the argument/CORS guards and YAML rendering were exercised locally.

## 2. Migration (additive)

`20261123120000_m5_01_enquiries_bridge`:

- new tables `event_functions`, `external_identities`, `external_record_links`;
- `users.disabled_at`, `customers.external_managed`, `customers.phone_normalized`, `events.source` (default `'eventos'`), `events.external_ref` — all nullable or defaulted;
- `events.quotation_id` is relaxed to nullable (feed bookings have no quotation) — a constraint relaxation, not a destructive change;
- unique index `customers(tenant_id, phone_normalized)` — existing rows have NULL, so it applies cleanly; phones are normalised to E.164 going forward.

The migration was produced by `prisma migrate diff` and applied only to a scratch local database.

## 3. Deviations and design notes

1. **Per-environment resource names** (`eventos-api-staging|prod`, `eventos-migrate-<env>`) instead of a single `eventos-api`, because both environments share a project and region.
2. **Cancellation runs outside the sync transaction** (through `BookingApplicationService.cancelBooking`, so audit/events/rules are shared) with a second transaction updating the link. It is idempotent on retry.
3. **`rawBody: true` is global** in `NestFactory.create` (Nest has no route-scoped switch); only the feed guard reads it.
4. **Feed status/counters live in Redis** (best-effort, reset on flush).
5. **New API surface not named in the brief**: `PATCH /bookings/:id`, `GET /bookings/:id/functions`; permissions `users:write`, `bookings:update`, `integrations:enquiries:manage`, `integrations:financials:read`. The web RBAC mirror was **not** updated.
6. A cancelled booking is never revived by a later approval (kept deliberately conservative).
7. `assigneeName` is stored only in the link payload (no EventOS user mapping).
8. Throttling runs after the JWT guard (per-user limits need the identity).
9. `STORAGE_PROVIDER=local` on Cloud Run writes to ephemeral `/tmp`: **uploads are not durable** until S3-compatible storage is configured (documented in the YAML and README).
10. Email/AI providers are `none` in the service definitions.
11. Cloudflare must stay DNS-only: the API trusts exactly one proxy hop.
12. The prod seed (`prisma/seed-prod.ts`) takes the owner from required env (`SEED_OWNER_EMAIL`), never hardcoded.

## 4. Security review

| Topic | Assessment |
| --- | --- |
| Feed authentication | HMAC-SHA256 over `timestamp + "." + rawBody`; constant-time comparison against every configured secret (supports rotation); ±300 s skew; generic `401 INVALID_SIGNATURE` (reason only logged); fails closed if no secret is configured (and the secret is required in staging/production by env validation). |
| Replay | Delivery-id ledger in Redis (`SET NX EX 24h`, released on failure). It fails open if Redis is unavailable; correctness then rests on `sourceUpdatedAt` ordering and the unique link key, so replays are harmless but not blocked. |
| Tenant isolation | Feed tenant comes from `ENQUIRIES_FEED_TENANT_ID` (env) — never from the body or headers; all repositories remain `TenantScopedRepository`. |
| Input validation | Strict zod schemas (unknown keys rejected, bounded lengths and array sizes); payload `raw` is stored but never interpreted. |
| Concurrency | One transaction per delivery plus a per-tenant advisory lock; a 50-delivery burst test and a real-database concurrent smoke run passed. |
| Firebase exchange | Revocation check, audience pinned to the project, `iat` ≤ 5 min; unlinked identities rejected (`IDENTITY_NOT_LINKED`); disabled users rejected; Firebase `uid` is the only trust anchor — email is not used to auto-link (prevents account takeover through email reuse); 10/min per IP. ADC on Cloud Run, no key file. |
| Authorisation | Linking needs `users:write` (owner/admin); feed status/backfill need `integrations:enquiries:manage`; money is exposed only via `integrations:financials:read` and is not part of the booking DTO. |
| Data minimisation / logs | Signature header, `idToken`, tokens censored; phone fields masked to last four digits. |
| Rate limiting & proxy | Redis-backed throttler; trust-proxy = 1 hop. **Risk:** enabling Cloudflare's proxy without raising the hop count would collapse per-IP limits onto Cloudflare addresses. |
| Secrets | No secrets in the YAML, scripts or CI; Secret Manager references with per-secret `secretAccessor`; GitHub → GCP via Workload Identity Federation (no JSON keys), provider restricted to the repository by an attribute condition. |
| Deploy blast radius | Deployer SA has `run.admin` + `artifactregistry.writer` at project level (broad within Cloud Run); production job is gated by GitHub Environment reviewers. Consider restricting the WIF condition to `refs/heads/main` and `refs/tags/v*`. |
| Public invoker | `allUsers` on `roles/run.invoker` — intended (the API authenticates callers); blocked by a domain-restricted-sharing org policy, in which case use a load balancer. |
| Residual risks | Uploads on ephemeral disk; single Redis (Basic tier, no failover) – degrades throttling/ledger only; one shared feed secret across environments (provisioned once; create a separate staging secret if the sender can support it); Cloud SQL is a single zonal instance (RTO bounded by clone-from-PITR). |

## 5. Operator runbook

Order matters. Detailed commands: `infrastructure/gcp/README.md`.

### A. One-time (human with project owner rights)

1. Run README steps 0–7: APIs, Artifact Registry, runtime SA, Cloud SQL (+ grants), Memorystore + VPC connector, Secret Manager (+ per-secret accessor), WIF + deployer SA.
2. Create GitHub Environments `staging` and `production` (required reviewers on production); set variables `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOYER_SERVICE_ACCOUNT`, `CORS_ORIGIN` on each. Replace the `REPLACE_OWNER/REPLACE_REPO` placeholder with the real repository.
3. First deploy: push to `main` (staging) and verify `https://<service-url>/health/ready`; for production tag `v1.0.0` (or run `deploy.sh prod` manually) and approve.
4. Run the production seed job (README step 9) with the owner's email.
5. Create the domain mappings and Cloudflare DNS-only CNAMEs (step 10); wait for the certificate.
6. Hand the feed secret and the base URL to the Enquiries operator (the sender must implement the contract in `docs/integrations/enquiries-bridge-contract.md`).

### B. Link the existing Firebase users

1. Export the team as CSV `uid,email,eventosRole,name`.
2. Dry run: `pnpm exec tsx scripts/link-firebase-users.ts --file team.csv` (against production through a Cloud Run Job or a Cloud SQL proxy session — never from a laptop without approval). Review conflicts.
3. Apply with `--apply`. Verify one user can sign in through `POST /auth/firebase/exchange`.

### C. Backfill existing enquiries

Follow "Backfill procedure" in the contract: `backfill-check` → resend `missing`/`stale` → repeat until empty. Watch `GET /integrations/enquiries/status`.

### D. Routine operations

- **Deploy:** merge to `main` → staging; tag `vX.Y.Z` → production (after approval).
- **Rollback:** `infrastructure/gcp/rollback.sh prod`; migrations are additive and not reverted.
- **Rotate the feed secret:** README "Rotating the feed secret" (two-secret overlap, no downtime).
- **Restore data:** Cloud SQL PITR clone (`infrastructure/disaster-recovery/`); run the restore drill quarterly.
- **Sentry:** add a real DSN as a new `eventos-<env>-sentry-dsn` secret version and redeploy.

### E. Retirement (ADR-019 phase 3)

Stop the sender → remove `ENQUIRIES_FEED_*` secrets → remove the routes → drop bridge tables via a reviewed migration.

## 6. Open items and uncertainties

- Docker `migrator` image and the Cloud Run YAML were not built/deployed here; first real deploy may surface small gcloud flag differences (for example `--vpc-egress` on jobs, domain-mapping availability in `asia-south1`).
- Web RBAC mirror lacks the new permissions (UI for linking/feed status is not part of this task).
- Durable document storage on Cloud Run is outstanding.
- The GitHub repository slug and CORS origins are placeholders to be supplied by the operator.
