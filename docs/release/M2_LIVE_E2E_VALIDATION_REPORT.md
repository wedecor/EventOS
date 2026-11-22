# M2 — Live E2E Validation Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Release branch** | `release/m0-m1-core-workflows` |
| **Preserved RC feature commit** | `2c79170` |
| **Preserved RC docs tip (pre-M2 worktree)** | `eed9b6c` |
| **Validation mode** | Live UI → API → PostgreSQL (isolated) |
| **Push / merge / rebase** | **Not performed** |

**Verdict:** The complete 12-step Admin Portal workflow was executed successfully in Chromium against a seeded isolated stack. Post-run database verification passed. Unit/typecheck/build regressions remain green. This is a **live** validation (not a skip).

---

## 1. Environment configuration

### Isolation strategy

Host Homebrew Postgres already owns `127.0.0.1:5432`, so the default `eventos-postgres` container port mapping is unsafe for host clients. M2 therefore used a **dedicated compose file** and alternate ports:

| Service | Container | Host port | Notes |
|---------|-----------|-----------|-------|
| PostgreSQL 16 | `eventos-postgres-e2e` | **55432** | DB name `eventos_e2e` |
| Redis 7 | `eventos-redis-e2e` | **56379** | No persistence (`--save ''`) |
| API (Nest) | host process | **3100** | Avoids port 3000 (WeDecor Reels) |
| Web (static export) | `serve out -l 3101` | **3101** | Serve `apps/web/out/` only — **never** `next start` (static `output: 'export'`) |

Compose file: `infrastructure/docker/docker-compose.e2e.yml`

```bash
docker compose -f infrastructure/docker/docker-compose.e2e.yml up -d
```

### Env files (created; existing files untouched)

| File | Purpose |
|------|---------|
| `apps/api/.env.e2e` | Isolated API env (gitignored via `.env.e2e` pattern) |
| `apps/web/.env.e2e` | Portal public API URL for documentation |

**Not modified:** `apps/api/.env`, `apps/web/.env.local`.

Synthetic credentials only (from local `apps/api/.env.e2e`, **not** committed):

- Admin email: `admin@wedecor.events`
- Admin password: value of `SEED_ADMIN_PASSWORD` / `E2E_ADMIN_PASSWORD`
- JWT secret: E2E-only string (≥32 chars) in `.env.e2e`
- No production credentials used

### Migrations

```bash
set -a; source apps/api/.env.e2e; set +a
pnpm exec prisma migrate deploy   # against eventos_e2e @ :55432
```

All snapshot migrations applied cleanly (Sprint1 → P2-09).

---

## 2. Seed strategy

Script: `apps/api/prisma/seed-e2e.ts`

| Fixture | Fixed UUID / value | Role |
|---------|--------------------|------|
| Tenant | `00000000-0000-0000-0000-000000000001` | PHASE1_TENANT_ID |
| Admin user | `11111111-1111-4111-8111-111111111111` | Login + execution owner |
| Staff member | `22222222-2222-4222-8222-222222222222` | Workspace staff assignment |
| Vendor | `33333333-3333-4333-8333-333333333333` | Procurement + expense |
| Reference customer | `44444444-4444-4444-8444-444444444444` | Baseline only |

Guard: seed refuses to run unless `DATABASE_URL` contains `eventos_e2e`.

Fixture manifest written to `apps/web/e2e/fixtures.generated.json` (gitignored) for Playwright.

**Workflow entities** (customer/lead/quotation/line items/payments/booking/expense) are created **via the UI** during the Playwright run for true end-to-end coverage—not pre-inserted as a fake happy path.

---

## 3. E2E execution results

### Suite

- Spec: `apps/web/e2e/core-workflow.spec.ts`
- Runner: Playwright Chromium, `E2E_TRACE=1`
- Auth: `E2E_ADMIN_PASSWORD` set (not skipped)

### Confirmed live pass

```
✓ lead → quote → advance → booking → execution → complete → profitability (9.8s)
1 passed
```

Commands:

```bash
# Load synthetic password from local .env.e2e (gitignored)
set -a; source ../api/.env.e2e; set +a
E2E_BASE_URL=http://localhost:3101 \
E2E_API_BASE_URL=http://localhost:3100 \
E2E_ADMIN_EMAIL=admin@wedecor.events \
E2E_ADMIN_PASSWORD="$SEED_ADMIN_PASSWORD" \
E2E_TRACE=1 \
pnpm exec playwright test --reporter=list
```

### 12-step coverage (browser UI)

| # | Step | UI path | Result |
|---|------|---------|--------|
| 1 | Login | `/login/` | Pass |
| 2 | Create lead | `/app/leads/new/` (+ customer prerequisite) | Pass |
| 3 | Follow-up schedule + Done | Lead detail | Pass |
| 4 | Create quotation | `/app/quotations/new/` | Pass |
| 5 | Line items add / edit / delete | Quotation detail | Pass |
| 6 | Send quotation | Confirm dialog | Pass |
| 7 | Advance payment (pre-approve) | Payments panel | Pass |
| 8 | Approve → booking | Approve dialog | Pass |
| 9 | Assign vendor + staff + execution owner | Workspace + booking detail | Pass |
| 10 | `in_preparation` → `in_execution` | Booking status actions | Pass |
| 11 | Complete event | Complete dialog | Pass |
| 12 | Expense + final payment + profitability | `/app/finance/booking/` | Pass |

**Business-rule note:** Advance payment is recorded **before** approve so EP1-BR-001 can convert the quotation to a booking. Approve-then-advance would leave `eventId` null.

### Artifacts

Generated Playwright outputs are **local-only** (gitignored under `docs/release/m2-artifacts/`, `apps/web/playwright-report/`, `apps/web/test-results/`). Regenerate with `E2E_TRACE=1 pnpm exec playwright test`.

| Artifact (local) | Typical path |
|------------------|--------------|
| Playwright HTML report | `apps/web/playwright-report/index.html` |
| Trace (zip) | `apps/web/test-results/**/trace.zip` |

View trace: `pnpm exec playwright show-trace <path-to-trace.zip>`

---

## 4. Database verification

Script: `apps/api/scripts/verify-e2e-db.ts` (tenant-scoped assertions only).

Latest successful verification payload:

```json
{
  "ok": true,
  "bookingId": "052f8af1-3113-40e8-8f52-bed7e045fc9e",
  "quotationId": "72a27e39-ef06-4221-a327-db08860ea040",
  "quotationTotal": 100000,
  "lineCount": 1,
  "lineTotal": 100000,
  "paymentCount": 2,
  "paymentTotal": 100000,
  "expenseCount": 1,
  "expenseTotal": 15000,
  "staffAssignments": 1,
  "procurements": 1,
  "profitabilityApprox": 85000,
  "statusPath": "completed"
}
```

Checks performed:

- Tenant ownership (`PHASE1_TENANT_ID`)
- Quotation `approved`; line totals == quotation total
- ≥2 confirmed payments; no duplicate payment ids
- Advance anchored to quotation/lead; final payment booking-scoped
- Staff assignment + vendor procurement present
- Confirmed vendor expense present
- Zero draft invoices (EP1-BR-002 compatible)
- Booking status `completed` with execution owner set

---

## 5. Financial reconciliation

| Metric | Amount (INR) |
|--------|-------------:|
| Quotation total (1 × 100000) | 100,000 |
| Advance payment | 25,000 |
| Final booking payment | 75,000 |
| **Payments total** | **100,000** |
| Vendor expense | 15,000 |
| **Approx contribution (payments − expenses)** | **85,000** |

No duplicate confirmed payments detected for the verified booking/quotation set.

---

## 6. Failures investigated (and fixes)

| Failure | Class | Root cause | Fix |
|---------|-------|------------|-----|
| `getByLabel('Email')` timeout on first runs | Application (a11y) | `FormLabel`/`FormControl` did not wire `htmlFor`/`id` | Fixed `apps/web/src/shared/components/forms/form.tsx` (Slot + useId association) |
| Vendor assertion flake | Test | `getByText(/E2E Floral/)` matched hidden `<option>` | Assert `getByRole('link', { name: 'Open procurement' })` |
| Later runs: blank “Internal Server Error” on `/login/` | Environment | `pnpm build` ran while `next dev` was active; corrupted `.next` manifests | Restarted clean `next dev` after `rm -rf .next`; **do not** build while E2E web is running |
| `nest build` TS6133 on verify script | Tooling | `scripts/` included in build tsconfig | Excluded `scripts` in `tsconfig.build.json` |

Assertions were **not** weakened to force green. Skips were not used for the successful live run.

---

## 7. Final validation matrix

| Gate | Result |
|------|--------|
| Live Playwright E2E | **1 passed** (credentials set) |
| DB verification | **ok: true** |
| API unit | **705 passed** |
| API build | **Pass** |
| Web unit | **121 passed** |
| Web typecheck | **Pass** |
| Web build | **Pass** (run after stopping E2E `next dev`) |

---

## 8. M2 commit package (included in validation commit)

RC tip `eed9b6c` is preserved as parent history. M2 validation lands as a new commit on `release/m0-m1-core-workflows` (no amend of `2c79170` / `eed9b6c`):

- `apps/web/src/shared/components/forms/form.tsx` (a11y label wiring)
- `apps/web/e2e/**`, `playwright.config.ts`
- `apps/api/prisma/seed-e2e.ts`, `apps/api/scripts/verify-e2e-db.ts`
- `infrastructure/docker/docker-compose.e2e.yml`
- `apps/api/tsconfig.build.json` (exclude `scripts` + `prisma` from Nest build)
- `.gitignore` (`.env.e2e`, fixtures, Playwright artifacts, `m2-artifacts` binaries)
- `docs/release/m2-artifacts/README.md`, this report

`apps/api/.env.e2e` / `apps/web/.env.e2e` stay local/gitignored. See `docs/release/M2_RELEASE_COMMIT_REPORT.md` for the commit hash.

---

## 9. Remaining blockers / recommendations

1. **CI:** add isolated compose + seed + Playwright job with repository secrets for `SEED_ADMIN_PASSWORD` (never hardcode).
2. **Operator rule:** never run `next build` concurrent with `next dev` on the same app directory during E2E.
3. **Selective ports from main** (PDF helpers, etc.) still deferred per reconciliation report.
4. **Push / PR** still requires explicit approval (not performed in M2).

---

## 10. Release recommendation

| Question | Answer |
|----------|--------|
| Was live E2E executed end-to-end? | **Yes** |
| Is a skipped Playwright run being treated as pass? | **No** |
| Is the RC feature commit intact? | **Yes** (`2c79170`) |
| Ready to push? | **No** — push requires explicit approval |
| Promote readiness | **Conditionally ready** after optional CI wiring; still no merge to `origin/main` without reconciliation strategy approval |

---

*End of M2 live E2E validation report.*
