# Operational recovery checklist

Day-of checklist for production or staging SEV-1 recovery. Pair with [disaster-recovery-runbook.md](./disaster-recovery-runbook.md).

## Before changing anything

- [ ] Incident declared; `T0` recorded
- [ ] Stakeholders notified
- [ ] Latest backup / WAL status confirmed
- [ ] PITR target time chosen (if applicable)

## Dependency order

- [ ] Secrets available
- [ ] PostgreSQL restored
- [ ] Redis available
- [ ] Object storage reachable
- [ ] API image identified (last known good tag)
- [ ] Health probes green (JSON readiness `ok`)
- [ ] Traffic restored

## Do / don’t

| Do | Don’t |
|----|-------|
| Restore Postgres before opening writes | Point production DNS at an empty database |
| Prefer empty Redis after PITR | Assume Redis RDB matches an older Postgres dump |
| Measure RTO/RPO | Skip the restore verification checklist |
| Keep secrets out of chat logs | Commit connection strings |

## After recovery

- [ ] [restore-verification-checklist.md](./restore-verification-checklist.md) completed
- [ ] Monitoring alerts quiet / explained
- [ ] Post-incident notes filed
- [ ] Schedule follow-up monthly restore if this was an emergency (not a drill)
