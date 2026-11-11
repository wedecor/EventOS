# M3 — Release Commit Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Release branch** | `release/m0-m1-core-workflows` |
| **M3 commit** | `35cc002997f4c16ed027070637a6ff4751664f8d` |
| **Commit subject** | `feat(eventos): complete M3 integration foundation` |
| **Parent** | `6a0dc101901170daa454d9605890fafdbdd5f02f` (`docs(release): add M2 release commit report`) |
| **Preserved M2 commit** | `d8ed43c` (ancestor of HEAD) |
| **Push / merge / rebase / reset** | **Not performed** |

**Verdict:** M3 integration foundation is committed locally on the preserved release branch. Secrets and generated E2E artifacts were excluded. Live SMTP/S3 were **not** claimed. Production DB was **not** migrated.

---

## 1. Commit identity

```
35cc002 feat(eventos): complete M3 integration foundation
6a0dc10 docs(release): add M2 release commit report
d8ed43c feat(eventos): complete M2 live workflow validation
eed9b6c docs(release): add M0-M1 release preparation report
2c79170 feat(eventos): complete M0-M1 core workflows
```

History was extended with a new commit only. Existing release commits were not amended, rebased, or rewritten.

---

## 2. Files committed (82)

Summary of the M3 commit (`git show --name-only --pretty=format: 35cc002`):

### Migrations & schema
- `apps/api/prisma/migrations/20261112040000_m3_integration_foundation/migration.sql`
- `apps/api/prisma/migrations/20261112043000_m3_integration_secrets/migration.sql`
- `apps/api/prisma/schema.prisma`

### API — PDF, documents, mail, integrations
- `apps/api/src/shared/pdf/*`
- `apps/api/src/shared/storage/*`
- `apps/api/src/shared/mail/*`
- `apps/api/src/shared/crypto/secret-box.ts` (+ spec)
- `apps/api/src/modules/documents/*`
- `apps/api/src/modules/integrations/*`
- `apps/api/src/modules/quotation/application/services/quotation-pdf.application.service.ts`
- `apps/api/src/modules/finance/application/services/invoice-pdf.application.service.ts`
- `apps/api/src/modules/communication/application/services/outbound-email.application.service.ts`
- Controllers/services wiring: quotation, invoice, communication, app/repositories/application-services modules
- Config: `env.schema.ts`, `configuration.ts`, `.env.example`
- Deps: `apps/api/package.json`, `pnpm-lock.yaml` (pdfkit, multer, nodemailer, @aws-sdk/client-s3, types)

### OpenAPI / generated types (established workflow)
- `apps/api/openapi/openapi.v1.json` (regenerated; includes M3 paths)
- `apps/web/src/types/api.generated.ts` (regenerated via `openapi:generate`)

### Admin Portal
- Quotation/invoice PDF + Email PDF UI
- Booking finance Event documents panel
- Settings → Integrations form (masked secrets + connection tests)
- `apps/web/src/shared/lib/download-blob.ts`
- `apps/web/tsconfig.json` (exclude e2e from app typecheck)

### Playwright
- `apps/web/e2e/m3-integration-workflow.spec.ts`
- `apps/web/e2e/helpers/db.ts`, `m3-setup.ts`
- `apps/web/e2e/core-workflow.spec.ts` (Mark sent label for status send)

### Docs
- `docs/implementation/M3_RECONNAISSANCE.md`
- `docs/implementation/M3_IMPLEMENTATION_PLAN.md`
- `docs/implementation/M3_IMPLEMENTATION_REPORT.md`
- `docs/implementation/M3_GAP_ANALYSIS.md`

### Ignore rules
- `.gitignore` — `apps/api/.data/`, M3 fixture/PDF artifact patterns

---

## 3. Explicitly excluded (not committed)

| Item | Reason |
|------|--------|
| `apps/api/.env`, `apps/api/.env.e2e` | Local secrets (gitignored) |
| `apps/web/.env.local` | Untouched |
| `apps/web/e2e/fixtures.generated.json` | Generated (gitignored) |
| `apps/web/e2e/m3-fixtures.generated.json` | Generated (gitignored) |
| `apps/web/e2e/m3-contract-*.pdf` | Temp upload artifacts (gitignored) |
| `apps/web/playwright-report/`, `test-results/` | Generated (gitignored) |
| Production DB migration | Never applied |

---

## 4. Migrations

| Migration | Purpose |
|-----------|---------|
| `20261112040000_m3_integration_foundation` | `stored_documents`, base `integration_settings`, communication email columns + FKs/indexes |
| `20261112043000_m3_integration_secrets` | Encrypted secret columns + smtp/storage access fields |

**Applied to:** isolated `eventos_e2e` @ `127.0.0.1:55432` only.  
**Not applied to:** production `eventos` @ `:5432`.

---

## 5. Secret encryption / JWT_SECRET

- IntegrationSettings secrets use AES-256-GCM (`shared/crypto/secret-box`) with key material derived from `JWT_SECRET` (≥32 characters; already required by `env.schema`).
- `.env.example` documents that rotating `JWT_SECRET` requires re-entering integration secrets.
- API responses never return ciphertext or plaintext secrets; UI shows masked indicators only.

---

## 6. Regression results (final pre-commit run)

| Gate | Result |
|------|--------|
| API Jest | **722 passed** |
| Web Vitest | **121 passed** |
| API `pnpm build` | **Pass** |
| Web `pnpm typecheck` | **Pass** |
| Web `pnpm build` | **Pass** |
| Playwright (this final run) | **Not re-executed** |

### Playwright evidence (prior validation session; cited separately)

| Suite | Result |
|-------|--------|
| M2 `e2e/core-workflow.spec.ts` | **Passed** (after Mark sent locator update) |
| M3 `e2e/m3-integration-workflow.spec.ts` | **Passed** (UI + DB assertions) |

---

## 7. Live provider limitations

| Provider | Status |
|----------|--------|
| Test mail adapter | Validated (unit + Playwright) |
| Local storage | Validated (unit + Playwright + connection test) |
| **SMTP live** | **Not verified** |
| **S3 live** | **Not verified** |

Saving IntegrationSettings does **not** claim a provider is connected; only connection-test fields record probe/acceptance status.

---

## 8. Remaining deployment tasks

1. Apply both M3 migrations to staging/production under operator change control.
2. Configure `STORAGE_*` / `MAIL_*` / `SMTP_*` for the target environment.
3. Ensure local storage root is writable **or** configure S3 and run live connection tests.
4. Optional live SMTP smoke with real credentials.
5. Optional live S3 smoke with real credentials.
6. Deploy API + static Admin Portal.
7. Push/merge only when explicitly authorized (not done here).

---

## 9. Final Git status (after M3 feat commit)

```
branch: release/m0-m1-core-workflows
HEAD:   35cc002 feat(eventos): complete M3 integration foundation
parent: 6a0dc10
M2:     d8ed43c is ancestor
tree:   clean (prior to this report file)
```

Push was not performed.

---

*End of M3 release commit report.*
