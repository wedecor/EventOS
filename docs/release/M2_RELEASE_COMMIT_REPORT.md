# M2 — Release Commit Report

| Field | Value |
|-------|-------|
| **Date** | 2026-11-12 |
| **Release branch** | `release/m0-m1-core-workflows` |
| **M2 validation commit** | `d8ed43cbfc27a490ccbe9703d0edf67cc60ba7cc` |
| **Commit subject** | `feat(eventos): complete M2 live workflow validation` |
| **Parent (RC docs tip)** | `eed9b6cd4e9c4e8e1274a2912a508d14769a5720` |
| **Preserved RC feature commit** | `2c79170` |
| **Push / merge / rebase / reset** | **Not performed** |

**Verdict:** Verified M2 live E2E implementation is committed locally on the preserved release branch. Secrets and generated artifacts were excluded. Regression gates re-checked green before commit.

---

## 1. Commit identity

```
d8ed43c feat(eventos): complete M2 live workflow validation
eed9b6c docs(release): add M0-M1 release preparation report
2c79170 feat(eventos): complete M0-M1 core workflows
```

History was extended with a new commit only. Existing release commits were not amended, rebased, or rewritten.

---

## 2. Files changed (12)

| Path | Change | Role |
|------|--------|------|
| `.gitignore` | modified | Ignore `.env.e2e`, fixtures, Playwright reports/results, `m2-artifacts` binaries |
| `apps/api/prisma/seed-e2e.ts` | added | Deterministic isolated E2E seed (`SEED_ADMIN_PASSWORD` required; no hardcoded secret) |
| `apps/api/scripts/verify-e2e-db.ts` | added | Post-E2E tenant-scoped DB assertions |
| `apps/api/tsconfig.build.json` | modified | Exclude `scripts` + `prisma` from Nest build (avoids compiling seed/verify tooling) |
| `apps/web/e2e/core-workflow.spec.ts` | modified | Full 12-step live UI workflow (line CRUD, advance-before-approve, vendors/staff, expense, profitability) |
| `apps/web/e2e/helpers/auth.ts` | modified | Login wait/a11y-safe email field visibility |
| `apps/web/e2e/helpers/env.ts` | modified | Default API base → `http://localhost:3100` |
| `apps/web/playwright.config.ts` | modified | Default web base → `http://localhost:3101`; longer timeout; optional full trace |
| `apps/web/src/shared/components/forms/form.tsx` | modified | Accessibility: `FormLabel`/`FormControl` `htmlFor`/`id` via Slot + `useId` |
| `docs/release/M2_LIVE_E2E_VALIDATION_REPORT.md` | added | Live validation narrative + evidence |
| `docs/release/m2-artifacts/README.md` | added | How to regenerate local artifacts (binaries gitignored) |
| `infrastructure/docker/docker-compose.e2e.yml` | added | Isolated Postgres `:55432` + Redis `:56379` |

---

## 3. Explicitly excluded (not committed)

| Item | Reason |
|------|--------|
| `apps/api/.env.e2e` | Local synthetic secrets (gitignored) |
| `apps/web/.env.e2e` | Local portal E2E env (gitignored) |
| `apps/api/.env`, `apps/web/.env.local` | Untouched; not overwritten |
| `apps/web/e2e/fixtures.generated.json` | Generated seed manifest (gitignored) |
| `apps/web/playwright-report/` | Generated HTML report (gitignored) |
| `apps/web/test-results/` | Generated traces/videos (gitignored) |
| `docs/release/m2-artifacts/*.zip`, `*.html`, `*.png` | Generated binaries (gitignored) |

---

## 4. Review notes

### Accessibility fix

`FormLabel` now sets `htmlFor` to the form item id; `FormControl` uses Radix `Slot` to apply matching `id`, `aria-describedby`, and `aria-invalid`. This unblocked Playwright `getByLabel('Email')` on `/login/` without weakening assertions.

### Nest build exclusion

`tsconfig.build.json` excludes `scripts` and `prisma` so Nest does not typecheck/compile E2E seed or DB verify tooling into `dist`. Production API build remains clean.

### Compose + seed

`docker-compose.e2e.yml` preserves the isolated data plane (DB `eventos_e2e`, ports 55432/56379). Seed refuses non-`eventos_e2e` URLs and requires `SEED_ADMIN_PASSWORD` from the local env file.

### Artifact references

Live report points at local regenerable paths under `docs/release/m2-artifacts/` and Playwright output dirs; only the artifacts README is versioned.

---

## 5. Test evidence (pre-commit regression)

| Gate | Result |
|------|--------|
| Live Playwright 12-step Chromium E2E | **Passed** (prior M2 validation run; API `:3100`, web `:3101`) |
| DB verification | **Passed** — status `completed`; payments `100000`; expenses `15000`; approx profit `85000` |
| API unit tests | **705 passed** |
| API `nest build` | **Passed** (after prisma/scripts exclusion + seed typing) |
| Web unit tests | **121 passed** |
| Web typecheck | **Passed** |
| Web build | **Passed** (earlier M2 matrix; do not run concurrent with `next dev`) |

---

## 6. Remaining blockers

1. **No push / PR yet** — requires explicit approval.
2. **CI job** for isolated compose + seed + Playwright with repository secret `SEED_ADMIN_PASSWORD` is not wired.
3. **Selective ports from `main`** (e.g. PDF helpers) remain deferred per branch reconciliation.
4. **No merge** to `origin/main` without an approved reconciliation strategy.
5. Operator caution: do not run `next build` while E2E `next dev` shares the same `apps/web` directory.

---

## 7. Post-commit verification

| Check | Result |
|-------|--------|
| `git rev-parse HEAD` | `d8ed43cbfc27a490ccbe9703d0edf67cc60ba7cc` |
| Parent | `eed9b6c` (RC tip preserved) |
| Branch | `release/m0-m1-core-workflows` |
| Working tree after M2 commit | Clean (this report added as follow-up docs commit) |

---

*End of M2 release commit report.*
