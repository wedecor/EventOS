# Event OS — Backup & Disaster Recovery (Repository Preparation)

> **R2-10 scope:** repository-side preparation only.
> This directory does **not** configure managed backups, WAL archiving, cron jobs,
> `pg_dump` / pgBackRest automation, Redis snapshot jobs, cloud snapshots, or Terraform.
> It documents the **required** backup/DR posture (docs/16, docs/07-database-philosophy)
> so operators can enable provider features and run drills later.
>
> Engineering Backlog R2-10 AC/DoD (automated daily backups + restore-to-staging drill
> with RPO/RTO report) is **operator execution** after this prep — not automated here.

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md) — §Backup Strategy, data rollback RPO
- [docs/07-database-philosophy.md](../../docs/07-database-philosophy.md) — §Backup and Recovery (RPO/RTO)
- [docs/20-definition-of-done.md](../../docs/20-definition-of-done.md) — database backups verified
- [infrastructure/staging/README.md](../staging/README.md) — staging topology
- [infrastructure/storage/README.md](../storage/README.md) — object storage (R2-09)
- [infrastructure/monitoring/alerts.example.yaml](../monitoring/alerts.example.yaml) — backup-failure alert

---

## Backup architecture (target)

```
                         ┌──────────────────────────────┐
                         │  Secret manager / git config │
                         │  (indefinite; versioned)     │
                         └──────────────────────────────┘

Managed PostgreSQL ──► continuous WAL archive + daily full backup
        │                    retention: 30d daily / 12mo monthly
        ▼
   Point-in-time recovery (PITR) capability  →  RPO < 1 hour

Managed Redis ──────► RDB snapshots (daily)
        │                    retention: 7 days
        ▼
   Cache / throttle / queue rebuild acceptable on loss

S3-compatible storage ► provider replication (+ optional versioning)
        │                    retention: indefinite / lifecycle (R2-09)
        ▼
   Blobs independent of DB; metadata in Postgres is source of truth for Attachment rows

API containers ──────► ephemeral; redeploy from image registry (R2-01)
```

**Source of truth for business data:** PostgreSQL.  
**Redis:** disposable for correctness if Postgres is restored (sessions/throttle/cache may reset).  
**Object storage:** durable blobs; Attachment rows in Postgres must remain consistent with keys.

---

## RPO / RTO definitions

| Objective | Target | Authority |
|-----------|--------|-----------|
| **RPO** (max acceptable data loss) | **&lt; 1 hour** | docs/07-database-philosophy; docs/16 data rollback |
| **RTO** (max time to restore service) | **&lt; 4 hours** | docs/07-database-philosophy |

Machine-readable copy: [rpo-rto.example.yaml](./rpo-rto.example.yaml).

| Component | Effective RPO note |
|-----------|-------------------|
| PostgreSQL (with WAL) | Bound to &lt; 1 hour target |
| Redis | Up to **24 hours** of cache/queue state if only daily RDB — **acceptable** (docs/16) |
| Object storage | Provider replication; treat as continuous |
| Configuration | Git; no data RPO |

---

## Backup retention schedule

| Component | Method | Frequency | Retention |
|-----------|--------|-----------|-----------|
| PostgreSQL | Managed automated backup + WAL archiving | Continuous WAL, daily full | **30 days** daily, **12 months** monthly |
| Redis | RDB snapshots | Daily | **7 days** |
| Object storage | Provider-native replication | Continuous | Indefinite (lifecycle per R2-09) |
| Configuration | Git | Every change | Indefinite |

Source: docs/16 §Backup Strategy. See [retention-schedule.example.yaml](./retention-schedule.example.yaml).

---

## Component strategies

### PostgreSQL — backup

| Item | Spec |
|------|------|
| Prefer | Managed provider automated backups + **continuous WAL** (PITR) |
| Daily full | Confirm provider “daily backup” window in the region of the staging/prod instance |
| Pre-migration | Take / confirm backup before production migrations (docs/16 §Migration Safety) |
| Secrets | Backup credentials stay in secret manager; never in git |
| Alert | Wire “Backup failure” → High (docs/16 / R2-08 catalog) |

### PostgreSQL — restore procedure (operator outline)

1. Declare incident; stop writes to the failed environment if possible (scale API to 0 / maintenance mode).
2. Provision or select an empty restore target (prefer **staging** for drills; isolated instance for production emergencies).
3. Restore from chosen recovery point (latest daily **or** PITR timestamp within RPO).
4. Verify Postgres accepts connections; run integrity checks (see restore verification checklist).
5. Point `DATABASE_URL` at restored instance (secret manager update).
6. Run `pnpm exec prisma migrate deploy` only if the restored dump is behind migrations — **do not** invent schema; prefer restoring a consistent backup that already matches the app image.
7. Proceed to Redis / app bring-up per [restore order](#restore-order--dependency-order).

Detailed runbook steps: [disaster-recovery-runbook.md](./disaster-recovery-runbook.md).

### PostgreSQL — Google Cloud SQL (M5-01 production topology)

The Cloud Run deployment (`infrastructure/gcp/`) uses one Cloud SQL for PostgreSQL 16
instance (`eventos-pg`, `asia-south1`) holding `eventos_staging` and `eventos_prod`.

| Item | Spec |
|------|------|
| Automated backups | Daily, window starts 21:00 UTC (02:30 IST), last **30** retained (matches the 30-day daily retention in docs/16) |
| Point-in-time recovery | Enabled; transaction logs retained **7 days** (RPO of minutes within that window) |
| Deletion protection | Enabled on the instance |
| Restore method | **Clone** to a new instance at a timestamp (never restore over the live instance first) |
| Pre-migration safety | Production deploys run `prisma migrate deploy` through the migration job; take an on-demand backup first for risky releases: `gcloud sql backups create --instance=eventos-pg` |
| Restore drill | Quarterly, see [Cloud SQL restore drill](#cloud-sql-restore-drill) |

Clone and verify (the commands are run by an operator; nothing here executes them):

```bash
# 1. Pick a recovery point (UTC, RFC 3339), within the 7-day PITR window.
export RESTORE_TS="2026-11-23T05:30:00Z"

# 2. Clone to a NEW instance (private IP, same network). The clone includes both databases.
gcloud sql instances clone eventos-pg eventos-pg-restore-$(date +%Y%m%d)   --point-in-time="$RESTORE_TS" --project=wedecorenquries

# 3. Verify, then cut over by updating the DATABASE_URL secret (new instance connection name)
#    and redeploying; or export the damaged tables from the clone and import them.
gcloud sql connect eventos-pg-restore-$(date +%Y%m%d) --user=postgres --database=eventos_prod
```

Redis (Memorystore Basic) has no persistence: after any Postgres restore start it empty.
The Enquiries feed tolerates this — the replay ledger is advisory and `sourceUpdatedAt`
ordering keeps redeliveries idempotent.

#### Cloud SQL restore drill

Run quarterly (record it in [quarterly-dr-drill-template.md](./quarterly-dr-drill-template.md)):

1. Choose `RESTORE_TS` about one hour in the past; note the newest booking/lead `updated_at` in `eventos_staging` just before.
2. `gcloud sql instances clone eventos-pg eventos-pg-drill --point-in-time="$RESTORE_TS"` — record the elapsed time (RTO evidence).
3. Connect to the clone (`gcloud sql connect eventos-pg-drill --user=postgres --database=eventos_staging`) and run the [restore verification checklist](./restore-verification-checklist.md): `SELECT 1`, row counts on `tenants`, `users`, `bookings`, `external_record_links`, `_prisma_migrations` count equals the repo's migration count.
4. Confirm data freshness: the newest `updated_at` is at or just before `RESTORE_TS` (RPO evidence).
5. Delete the clone: `gcloud sql instances delete eventos-pg-drill` (drills never touch the live instance or `eventos_prod` writes).
6. File the drill record and any gaps against the runbook.

### Redis — backup

| Item | Spec |
|------|------|
| Method | RDB snapshots (docs/16) |
| Frequency | Daily |
| Retention | 7 days |
| Data criticality | Cache, login throttle, BullMQ — **acceptable loss** |
| After Postgres restore | Prefer **cold start** Redis (empty) unless a specific queue must be recovered |

### Redis — recovery procedure

1. If Redis is corrupted/unavailable: provision new managed Redis (or restore last RDB if required).
2. Update `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`.
3. Restart API; expect re-warmed cache and reset throttle counters / ephemeral queue state.
4. Confirm `/health/ready` shows Redis `up`.

### Object storage — backup considerations

| Item | Spec |
|------|------|
| Primary durability | Provider replication (docs/16) |
| Extra | Enable **versioning** on staging/prod buckets when available (R2-09) |
| Consistency | Postgres `Attachment.storage_key` must match objects; orphan blobs are preferable to orphan metadata after a DB-only restore |
| Restore drill | Spot-check a sample of keys after DB restore; do not assume cross-region copy unless configured |
| Out of scope here | Lifecycle automation, cross-account replication jobs |

---

## Restore order & dependency order

Bring services back in this order (dependencies first):

```
1. Secrets / env available (secret manager)
2. PostgreSQL restored and accepting connections     ← blocking
3. Redis available (new empty or restored RDB)       ← /health/ready
4. Object storage endpoint reachable                 ← attachments later
5. Run migrations only if required (see above)
6. Start API containers (R2-01 image)
7. Verify liveness + readiness (JSON status == ok)
8. Smoke business reads (lead/list or equivalent)
9. Re-enable traffic / DNS
```

**Do not** start the API against an empty or wrong database and “hope migrations rebuild production data.”

---

## Recovery testing cadence (docs/16)

| Cadence | Activity |
|---------|----------|
| **Monthly** | Restore database backup to **staging**; verify integrity |
| **Quarterly** | Full DR drill — restore DB, deploy app, verify data integrity; document recovery time |

Templates:

- [backup-verification-checklist.md](./backup-verification-checklist.md)
- [restore-verification-checklist.md](./restore-verification-checklist.md)
- [operational-recovery-checklist.md](./operational-recovery-checklist.md)
- [quarterly-dr-drill-template.md](./quarterly-dr-drill-template.md)

---

## Repository templates

| File | Purpose |
|------|---------|
| [rpo-rto.example.yaml](./rpo-rto.example.yaml) | RPO/RTO targets |
| [retention-schedule.example.yaml](./retention-schedule.example.yaml) | Retention table |
| [disaster-recovery-runbook.md](./disaster-recovery-runbook.md) | Step-by-step DR workflow |
| [backup-verification-checklist.md](./backup-verification-checklist.md) | Confirm backups exist / alerts |
| [restore-verification-checklist.md](./restore-verification-checklist.md) | Post-restore data checks |
| [operational-recovery-checklist.md](./operational-recovery-checklist.md) | Incident recovery checklist |
| [quarterly-dr-drill-template.md](./quarterly-dr-drill-template.md) | Drill report (backlog DoD shape) |

---

## Documentation drift (intentional)

| Topic | Notes |
|-------|--------|
| Backlog R2-10 AC | Automated daily Postgres + Redis RDB **configuration** is provider-side — not scripts in this repo |
| Backlog R2-10 DoD | Restore drill **report** filled during a real quarterly/monthly drill using the template |
| `docs/10-folder-structure` `backup-db.sh` | Not created here (user out of scope: backup scripts) |
