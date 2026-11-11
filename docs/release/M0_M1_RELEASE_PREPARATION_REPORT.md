# M0/M1 Release Preparation Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Release branch** | `release/m0-m1-core-workflows` |
| **M0/M1 commit** | `2c79170a36fffd6f9818d69b5bf7b52a608a8a89` |
| **Commit subject** | `feat(eventos): complete M0-M1 core workflows` |
| **Parent** | `91feb7b` (`snapshot/2026-11-04-wip` baseline tip before M0/M1 commit) |
| **Based on** | Verified M0/M1 commit only — **no** merge/rebase of `origin/main` |
| **Current checkout** | `release/m0-m1-core-workflows` @ `2c79170` |
| **Remote push** | **Not performed** (awaits explicit approval) |

---

## 1. Preflight summary

| Check | Result |
|-------|--------|
| Starting branch | `snapshot/2026-11-04-wip` @ `91feb7b` |
| Working tree before commit | 60 modified + intended untracked M0/M1/docs; no secrets detected |
| Change set vs implementation report | **Aligned** (line items, advance payments, execution transition, follow-ups, list hubs, OpenAPI, Playwright scaffold, audit/implementation/reconciliation docs) |
| Destructive ops | None |

---

## 2. Commit & branch

### 2.1 Commit

```
2c79170a36fffd6f9818d69b5bf7b52a608a8a89
feat(eventos): complete M0-M1 core workflows
75 files changed, 8033 insertions(+), 841 deletions(-)
```

`snapshot/2026-11-04-wip` was advanced to the same commit (commit created while checked out there), then `release/m0-m1-core-workflows` was created at that SHA and checked out. Neither branch was renamed or deleted. `origin/main` was not merged.

### 2.2 Working tree after preparation

| Path | Status |
|------|--------|
| Tracked source/docs | **Clean** at `2c79170` |
| `apps/web/playwright-report/` | Untracked — **excluded** (generated) |
| `apps/web/test-results/` | Untracked — **excluded** (generated) |

Note: `pnpm lint` (API) uses `--fix` and briefly reformatted 3 M0/M1 files during validation. Those autofixes were **restored** to match `2c79170` so the release tip stays bit-identical to the verified feature commit. Formatting cleanup is deferred (see blockers).

---

## 3. Files included in `2c79170`

### API

- `apps/api/openapi/openapi.v1.json`
- Booking: service + `startExecution` / list page + controller + repo `findPage` + specs
- Customer: list page + controller + repo + specs
- Lead: follow-up list + controller/service
- Payment: lead/quotation find + list services + specs
- Quotation: line-item GET, list page, clock-safe approve fixtures, controller/repo + specs
- Shared: `apps/api/src/shared/presentation/pagination.ts`
- Spec mock updates: dashboard / finance / inventory / staff / task / vendor (new `findPage` stubs)

### Web

- Playwright: `playwright.config.ts`, `e2e/**`, `@playwright/test` via `package.json` + lockfile
- Quotations: API/schemas/hooks, line-items panel, detail, hub list
- Finance: multi-anchor payments panel + hooks/API
- Leads: follow-up list/API/hooks/detail
- Bookings: list API/schemas, hub, start-execution UI
- Customers: list API/schemas, hub
- `apps/web/src/types/api.generated.ts`

### Docs

- `docs/audit/*` (5 audit docs)
- `docs/implementation/M0_M1_IMPLEMENTATION_PLAN.md`
- `docs/implementation/M0_M1_IMPLEMENTATION_REPORT.md`
- `docs/release/BRANCH_RECONCILIATION_REPORT.md`

---

## 4. Files excluded (intentionally)

| Path | Reason |
|------|--------|
| `apps/web/playwright-report/` | Generated HTML report |
| `apps/web/test-results/` | Playwright run artifact |
| Any `.env` / credentials | None present in change set; would be rejected |
| `origin/main`-only UAT/Vite/auth/presentation/PDF/CI | Selective port **not executed** this phase |
| eslint `--fix` whitespace churn | Restored; not mixed into feature commit |

---

## 5. Validation results (on `release/m0-m1-core-workflows` @ `2c79170`)

| Gate | Result |
|------|--------|
| API `pnpm test` | **705 passed**, 88 suites |
| API `pnpm build` | **Pass** (`nest build` after `prisma generate`) |
| API `pnpm lint` | **Pass** (exit 0; autofix noise restored afterward) |
| Web `pnpm test` | **121 passed**, 29 files |
| Web `pnpm typecheck` | **Pass** |
| Web `pnpm build` | **Pass** (Next static export) |
| Web `pnpm test:e2e` | **1 skipped** (no `E2E_ADMIN_PASSWORD` / `SEED_ADMIN_PASSWORD`) |

---

## 6. Selective port assessment (no ports applied)

Source of main-only candidates: commits `c00d3be` / merge `a6034b7` on `origin/main` (unique vs snapshot lineage).

### 6.1 PDF helpers — **PORT (helpers + unit test) / DEFER (HTTP wiring)**

| Item | Detail |
|------|--------|
| Files | `apps/api/src/shared/pdf/minimal-quotation-pdf.ts`, `quotation-pdf-lines.ts`, `quotation-pdf-lines.spec.ts` |
| Commit | Introduced in `c00d3be` |
| Dependencies | Domain types `QuotationRecord` / `QuotationLineItemRecord` (compatible with snapshot modular quotation module); **no** Nest/auth coupling in helpers |
| HTTP consumer on main | `modules/presentation/quotations.controller.ts` → `quotationService.generateQuotationPdf(...)` — presentation facade **absent** on release; `generateQuotationPdf` **not** implemented on snapshot modular quotation service |
| Compatibility | Helpers are portable pure functions. Endpoint requires new modular controller method + OpenAPI update (out of this prep) |
| Recommendation | **Port** the three `shared/pdf` files in a follow-up PR. **Defer** route/`generateQuotationPdf` until designed against modular controller + OpenAPI freeze. **Reject** importing `modules/presentation/**`. |

### 6.2 Integration tests — **DEFER (rewrite) / REJECT (as-is)**

| Item | Detail |
|------|--------|
| Files | `apps/api/test/integration/auth.integration-spec.ts`, `w5.integration-spec.ts`, `jest-integration.json` |
| Commit | `c00d3be` |
| Dependencies | `AppModule`, Redis token, **`src/auth/auth.constants`** (`REFRESH_COOKIE_NAME`), cookie-parser, UAT-era routes/behaviors; main `package.json` references `test:integration` in CI but script may be incomplete vs snapshot scripts |
| Compatibility | **Not drop-in** against modular `modules/auth` + Next portal contracts |
| Recommendation | **Reject** verbatim cherry-pick. **Defer** a rewritten integration suite targeting modular auth cookies/JWT and current OpenAPI paths. Snapshot already has e2e specs under `apps/api/test/*.e2e-spec.ts`. |

### 6.3 CI improvements — **DEFER (adopt ideas) / REJECT (replace workflows)**

| Item | Detail |
|------|--------|
| File | `.github/workflows/ci.yml` (main) |
| Commit | `c00d3be` |
| Snapshot CI | `.github/workflows/pull-request.yml`, `main-branch.yml` (Node 22 / apps/api lockfile / quality gates) |
| Main CI traits | Postgres service, `prisma migrate deploy`, seed, root `pnpm-lock.yaml`, Node 20, `test:integration`, separate web job assuming Vite layout |
| Compatibility | Root lockfile + Vite web job **conflict** with snapshot monorepo layout (api-local lockfile, Next portal) |
| Recommendation | **Reject** replacing snapshot workflows with `ci.yml`. **Defer** selective adoption: Postgres service job, migrate deploy on main-branch pipeline, optional Playwright job once seed secrets exist in CI. |

### 6.4 Explicit non-ports (reconfirmed)

| Candidate | Decision |
|-----------|----------|
| Vite UAT `apps/web` | **Reject** |
| `apps/api/src/auth/**` | **Reject** |
| `apps/api/src/modules/presentation/**` | **Reject** |
| Sep-2026 Prisma migrations on main | **Reject** blind apply; schema audit only if a future port needs columns |

---

## 7. Outstanding release blockers

1. **Live Playwright** not green — needs seeded API + web + `SEED_ADMIN_PASSWORD` / `E2E_ADMIN_PASSWORD`.
2. **No remote push / PR yet** — awaiting approval.
3. **`origin/main` not reconciled** — selective ports still pending; 16 mechanical conflicts remain if a full merge is later forced.
4. **Generated Playwright artifacts** still untracked locally — add ignore rules in a hygiene PR (not done here to avoid scope creep).
5. **eslint format drift** — three files would reformat on `pnpm lint --fix`; schedule a pure formatting commit or Prettier alignment before PR.
6. **BullMQ** still quarantined unused dependency (known; not a merge blocker).
7. **PDF download UX** still missing on modular API until helpers are ported and wired.

---

## 8. Recommended next approvals

1. Push `release/m0-m1-core-workflows` (`2c79170`) — **no force**.
2. Open PR targeting `main` with architecture note: Next portal + modular auth supersede Vite UAT + `src/auth`.
3. Follow-up PR: port `shared/pdf` helpers + unit test only.
4. Run live E2E on staging/seeded local before production promote.
5. Optional: CI workflow enhancement PR (Postgres + migrate) without adopting main’s Vite job.

---

## 9. Reproducibility checklist

```bash
git fetch origin
git checkout release/m0-m1-core-workflows
git rev-parse HEAD   # expect 2c79170a36fffd6f9818d69b5bf7b52a608a8a89

cd apps/api && pnpm test && pnpm build
cd ../web && pnpm test && pnpm typecheck && pnpm build
```

---

*Release candidate prepared locally. No merge, rebase, reset, force-push, or remote publish was performed.*
