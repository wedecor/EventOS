# Backup verification checklist

Use monthly (or after any backup configuration change). **Do not** invent backup jobs in this repo — verify the **managed provider** settings.

**Environment:** _____________ (staging / production)  
**Date:** _____________  
**Operator:** _____________

## PostgreSQL

- [ ] Automated daily full backups enabled
- [ ] Continuous WAL archiving / PITR enabled
- [ ] Retention matches docs/16: 30 days daily, 12 months monthly
- [ ] Last successful backup timestamp is within the last 24 hours
- [ ] Backup failure alert is configured (docs/16 High — see R2-08 catalog)
- [ ] Backup destination / encryption at rest confirmed (provider default OK)

## Redis

- [ ] Daily RDB snapshot (or provider equivalent) enabled
- [ ] Retention ≥ 7 days (docs/16)
- [ ] Last snapshot timestamp recorded

## Object storage

- [ ] Provider replication / durability class documented
- [ ] Versioning enabled (recommended; R2-09)
- [ ] Bucket is private (no public ACLs)

## Configuration

- [ ] Infrastructure docs / env templates remain in git
- [ ] Secrets are only in secret manager (not git)

## Sign-off

| Role | Name | Signature / date |
|------|------|------------------|
| Operator | | |
| Reviewer | | |

**Gaps / follow-ups:**
-
-
