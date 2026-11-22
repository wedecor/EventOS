# Quarterly disaster recovery drill — report template

> Fulfills the **shape** of Engineering Backlog R2-10 DoD (“Restore drill report documenting RPO/RTO achieved”) and docs/16 quarterly DR drill.
> Fill during a **real** drill. Do not fabricate results.

## Metadata

| Field | Value |
|-------|-------|
| Drill date | |
| Environment restored **into** | staging (recommended) |
| Source environment / backup | |
| Operator | |
| Observer / reviewer | |
| App image tag | |
| Postgres recovery point | |
| Redis approach | empty / restored RDB (circle one) |

## Scope executed

- [ ] Postgres restore
- [ ] Redis availability
- [ ] API deploy
- [ ] Health + readiness verification
- [ ] Data integrity spot checks
- [ ] (Optional) Object storage key spot check

## Timeline

| Milestone | Timestamp (UTC) |
|-----------|-----------------|
| `T0` drill start | |
| Postgres restore complete | |
| API healthy | |
| `T_recovered` smoke complete | |

**Measured RTO:** _____________ (target **&lt; 4 hours**)  
**Estimated data loss / RPO window:** _____________ (target **&lt; 1 hour**)

## Results

| Check | Pass/Fail | Notes |
|-------|-----------|-------|
| Backup available as expected | | |
| Restore succeeded | | |
| `/health` ok | | |
| `/health/ready` JSON ok | | |
| Data spot checks | | |
| RTO met | | |
| RPO met | | |

## Gaps & actions

| Gap | Owner | Due date |
|-----|-------|----------|
| | | |

## Sign-off

| Role | Name | Date |
|------|------|------|
| Operator | | |
| Reviewer | | |

**Conclusion (one paragraph):**
