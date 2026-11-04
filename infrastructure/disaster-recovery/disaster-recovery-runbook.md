# Event OS — Disaster Recovery Runbook (operator)

> Template only (R2-10). Provider consoles and credentials are environment-specific.
> Do not commit secrets. Do not run destructive restores against production without
> founder approval and a confirmed backup of the current state.

## 1. Severity & decision

| Severity | Example | Immediate action |
|----------|---------|------------------|
| SEV-1 | Postgres unreachable / data corruption | Declare DR; follow restore order |
| SEV-2 | Redis only down | Replace Redis; API may run degraded until ready |
| SEV-3 | Single object missing | Restore object version / re-upload; fix Attachment metadata if needed |

Confirm **RPO &lt; 1h** / **RTO &lt; 4h** targets still apply for SEV-1.

## 2. Communication

- [ ] Notify on-call / founders
- [ ] Freeze non-essential deploys and migrations
- [ ] Record incident start time (`T0`) for RTO measurement

## 3. Preserve evidence

- [ ] Capture error symptoms (`/health`, `/health/ready`, provider status)
- [ ] Note last known good write time (for PITR target)
- [ ] Confirm latest successful Postgres backup / WAL status in provider UI

## 4. Restore workflow (SEV-1)

### 4.1 Stop the bleeding

- [ ] Scale API to zero or enable maintenance page
- [ ] Prevent clients from writing to a half-restored DB

### 4.2 PostgreSQL

- [ ] Choose recovery point (PITR timestamp or daily backup)
- [ ] Restore to **new** instance or approved target (staging for drills)
- [ ] Verify TCP connect + `SELECT 1`
- [ ] Spot-check row counts / critical tables (see restore-verification-checklist)

### 4.3 Redis

- [ ] Provision empty Redis **or** restore RDB if explicitly required
- [ ] Update `REDIS_*` secrets
- [ ] Prefer empty Redis after Postgres PITR to avoid stale queue payloads

### 4.4 Object storage

- [ ] Confirm endpoint/bucket reachable with staging/prod credentials
- [ ] Spot-check sample `storage_key` values from restored Attachment rows

### 4.5 Application

- [ ] Ensure secrets match restored dependencies
- [ ] Deploy known-good API image
- [ ] `GET /health` → `status: ok`
- [ ] `GET /health/ready` → JSON `status: ok` (postgres + redis up)
- [ ] Smoke: authenticated read of a known entity

### 4.6 Cutover

- [ ] Update DNS / load balancer if endpoint changed
- [ ] Re-enable traffic
- [ ] Record `T_recovered` — RTO = `T_recovered - T0`
- [ ] Estimate data loss window — compare to RPO

## 5. Post-incident

- [ ] Fill [quarterly-dr-drill-template.md](./quarterly-dr-drill-template.md) (or incident report)
- [ ] File follow-ups (backup gaps, alert gaps, runbook edits)
- [ ] Confirm backup-failure alert still healthy (R2-08)

## Restore order (summary)

1. Secrets → 2. PostgreSQL → 3. Redis → 4. Object storage reachability → 5. API → 6. Traffic
