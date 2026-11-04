# Restore verification checklist

Use after any database restore (monthly staging restore or SEV-1 recovery).

**Environment restored into:** _____________  
**Recovery point (timestamp / backup id):** _____________  
**Date:** _____________  
**Operator:** _____________

## Connectivity

- [ ] Postgres accepts connections with restored `DATABASE_URL`
- [ ] Redis ping succeeds (`/health/ready` redis `up`)
- [ ] Object storage endpoint reachable (if attachments in scope)

## Health probes

- [ ] `GET /health` → `{ "status": "ok" }`
- [ ] `GET /health/ready` → JSON `status` === `ok` (not merely HTTP 200)
- [ ] postgres + redis checks both `up`

## Data integrity (PostgreSQL)

Adjust table names to the restored schema; minimum spot checks:

- [ ] `schema_migrations` / Prisma migrations history present and coherent with app image
- [ ] Tenant row exists for Phase 1 tenant `00000000-0000-0000-0000-000000000001` (if seeded)
- [ ] Sample Customer / Lead / Event counts non-zero (or match expected drill fixture)
- [ ] Sample Payment / Quotation row readable
- [ ] No obvious truncation at recovery point (compare known pre-drill marker row if used)

## Application smoke

- [ ] API starts without bootstrap env errors
- [ ] Login (or service token) succeeds in staging drill
- [ ] One authenticated list endpoint returns 200
- [ ] (Optional) Attachment metadata row’s `storage_key` exists in bucket

## Objectives

- [ ] Measured RTO: _____________ (target &lt; 4 hours)
- [ ] Estimated RPO / data loss window: _____________ (target &lt; 1 hour)

## Sign-off

| Role | Name | Signature / date |
|------|------|------------------|
| Operator | | |
| Reviewer | | |

**Issues found:**
-
-
