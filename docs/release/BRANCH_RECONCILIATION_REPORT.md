# Branch Reconciliation Report — EventOS

| Field | Value |
|-------|-------|
| **Date (UTC)** | 2026-11-11 |
| **Audit type** | Read-only git reconciliation |
| **Auditor role** | Principal Engineer / Release Engineering |
| **Current branch** | `snapshot/2026-11-04-wip` |
| **Current tip** | `91feb7b` (`chore: snapshot all uncommitted work (Jul–Sep 2026)`) |
| **Remote main** | `origin/main` @ `a6034b7` |
| **Merge-base** | `b6b158a` (`feat(dashboard): implement Sprint 6 Founder Dashboard and KPIs`) |
| **Upstream tracking** | **None** (local snapshot branch is not tracking a remote) |
| **Git operations performed** | `fetch` + inspection only. **No merge, rebase, reset, force-push, or branch delete.** |

**Approval gate:** Do not execute merge/rebase/commit until this report is explicitly approved.

---

## 1. Executive verdict

| Question | Answer |
|----------|--------|
| Are the branches diverged? | **Yes** — `origin/main...HEAD` = **2 / 1** (main ahead by 2 commits; snapshot ahead by 1) |
| Is M0/M1 safely on `origin/main` today? | **No** — M0/M1 lives as a **dirty working tree** on top of snapshot tip `91feb7b`, which itself is absent from main |
| Does M0/M1 depend on commits missing from main? | **Yes** — the entire Next.js Admin Portal, modular `modules/auth`, OpenAPI freeze, and P2/R-series schema land in `91feb7b` |
| Does main contain UAT work missing from snapshot? | **Yes** — Vite UAT SPA, legacy `src/auth`, `modules/presentation` facade, PDF helpers, W5 integration tests, root workspace `package.json`, `.github/workflows/ci.yml`, and three Sep-2026 migrations |
| Safest release lineage | **Snapshot lineage** (`91feb7b` + committed M0/M1), with **selective cherry-pick / port** of unique main UAT value — **not** a blind merge that dual-homes two frontends or two auth stacks |
| Mechanical conflicts if merging main → snapshot tip | **16** (content / add-add / modify-delete) via `git merge-tree` |
| Business-logic / architecture conflicts | **High** — parallel web stacks, parallel auth, parallel presentation layers, parallel migration lineages, dual list APIs |

---

## 2. Current working tree (critical release blocker)

M0/M1 completion is **not committed**.

| State | Count |
|-------|------:|
| Modified tracked files | 60 |
| Untracked paths (status) | 8 (+ report artifacts) |
| Diff vs `HEAD` | +5479 / −841 lines across 60 files |

Implications:

1. Any merge/rebase of `origin/main` **now** would mix uncommitted M0/M1 with conflict resolution and destroy auditability.
2. Playwright artifacts (`apps/web/playwright-report/`, `apps/web/test-results/`) appear untracked and should be ignored before any commit (hygiene only — not done in this audit).
3. **Precondition for reconciliation:** commit (or explicitly stash with a named WIP branch) M0/M1 on a child of `91feb7b` **after approval**.

---

## 3. Commit graph & unique commits

```
f6aa034  Phase 1 foundation
   …
b6b158a  Sprint 6 Founder Dashboard   ← MERGE-BASE
   ├─► 91feb7b  snapshot Jul–Sep WIP          ← snapshot/2026-11-04-wip (+ dirty M0/M1)
   └─► c00d3be  Sprint 1 W5 stack for UAT
         └─► a6034b7  Merge UAT web/auth with Sprints 2–6 API  ← origin/main
```

### 3.1 Unique to snapshot (`origin/main..HEAD`)

| SHA | Date | Subject |
|-----|------|---------|
| `91feb7b` | 2026-11-04 | chore: snapshot all uncommitted work (Jul–Sep 2026) |

**Scope:** ~875 files, +186k/−1k lines. Includes Admin Portal (Next.js), modular auth, OpenAPI, R/P2 migrations, infrastructure templates, engineering skills/docs.

### 3.2 Unique to `origin/main` (`HEAD..origin/main`)

| SHA | Date | Subject |
|-----|------|---------|
| `c00d3be` | 2026-09-13 | Deliver Sprint 1 W5 stack for UAT |
| `a6034b7` | 2026-09-13 | Merge origin/main and integrate Sprint 1 UAT web and auth with Sprints 2-6 API |

**Scope (combined vs base):** ~111 files, +16.5k/−41 lines on the UAT-side delta; merge commit also re-integrates Sprint 2–6 modular API onto that UAT line.

---

## 4. File-change comparison (committed tips only)

Relative to merge-base `b6b158a`:

| Set | File count |
|-----|----------:|
| Changed on `origin/main` | 111 |
| Changed on snapshot tip | 875 |
| **Intersection (overlap)** | **22** |
| Main-only | 89 |
| Snapshot-only | 853 |

### 4.1 Overlapping paths (committed)

```
.gitignore
apps/api/.env.example
apps/api/prisma/seed.ts
apps/api/src/auth/auth.module.ts
apps/api/src/common/health/health.controller.ts
apps/api/src/main.ts
apps/api/src/modules/booking/domain/repositories/event.repository.ts
apps/api/src/modules/booking/infrastructure/persistence/event.repository.impl.ts
apps/api/src/modules/customer/domain/repositories/contact.repository.ts
apps/api/src/modules/customer/domain/repositories/customer.repository.ts
apps/api/src/modules/customer/infrastructure/persistence/contact.repository.impl.ts
apps/api/src/modules/customer/infrastructure/persistence/customer.repository.impl.ts
apps/api/src/modules/lead/domain/repositories/lead.repository.ts
apps/api/src/modules/lead/infrastructure/persistence/lead.repository.impl.ts
apps/api/src/modules/quotation/domain/repositories/quotation.repository.ts
apps/api/src/modules/quotation/infrastructure/persistence/quotation.repository.impl.ts
apps/web/.env.example
apps/web/README.md
apps/web/package.json
apps/web/src/shared/api/client.ts
apps/web/tsconfig.json
docs/22-developer-onboarding.md
```

### 4.2 Overlap of `origin/main` changes vs **uncommitted M0/M1** working tree

These paths are both touched by main’s tip delta **and** dirty M0/M1 work — elevated risk after tip merge:

- `apps/api/src/modules/booking/domain/repositories/event.repository.ts`
- `apps/api/src/modules/booking/infrastructure/persistence/event.repository.impl.ts`
- `apps/api/src/modules/customer/application/services/customer.application.service.spec.ts`
- `apps/api/src/modules/customer/application/services/customer.application.service.ts`
- `apps/api/src/modules/customer/domain/repositories/customer.repository.ts`
- `apps/api/src/modules/customer/infrastructure/persistence/customer.repository.impl.ts`
- `apps/api/src/modules/quotation/domain/repositories/quotation.repository.ts`
- `apps/api/src/modules/quotation/infrastructure/persistence/quotation.repository.impl.ts`
- `apps/web/package.json`

---

## 5. Mechanical merge conflicts (committed tips)

Simulated with `git merge-tree` (no working-tree write): merging `origin/main` into `HEAD` yields **16 CONFLICT markers**.

### 5.1 Content conflicts

| Path | Type | Notes |
|------|------|-------|
| `.gitignore` | content | Both extended ignore rules |
| `apps/api/.env.example` | content | Different env surface |
| `apps/api/prisma/seed.ts` | content | Seed / admin password handling diverged |
| `apps/api/src/common/health/health.controller.ts` | content | Health endpoints diverged |
| `apps/api/src/main.ts` | content | Bootstrap / CORS / prefix diverged |
| `apps/api/src/modules/customer/infrastructure/persistence/customer.repository.impl.ts` | content | Parallel list APIs |
| `apps/api/src/modules/quotation/infrastructure/persistence/quotation.repository.impl.ts` | content | Parallel query methods |
| `docs/22-developer-onboarding.md` | content | Docs drift |

### 5.2 Add/add conflicts (same path, independent adds)

| Path | Meaning |
|------|---------|
| `apps/api/src/modules/customer/domain/repositories/contact.repository.ts` | Both sides introduced contact repo |
| `apps/api/src/modules/customer/infrastructure/persistence/contact.repository.impl.ts` | Same |
| `apps/web/.env.example` | Vite UAT vs Next portal env |
| `apps/web/README.md` | Two web products, one path |
| `apps/web/package.json` | **Vite SPA vs Next Admin Portal** |
| `apps/web/src/shared/api/client.ts` | Dual clients |
| `apps/web/tsconfig.json` | Dual TS projects |

### 5.3 Modify/delete

| Path | Meaning |
|------|---------|
| `apps/api/src/auth/auth.module.ts` | **Deleted on snapshot** (auth moved to `modules/auth`); **modified on main** (UAT auth stack retained under `src/auth`) |

### 5.4 Auto-merged overlaps (no marker — still review)

These merged cleanly in the tree simulation but still carry **semantic dual APIs**:

- `event.repository.ts` / impl  
- `customer.repository.ts`  
- `lead.repository.ts` / impl  
- `quotation.repository.ts`  

Example (business/API naming conflict, not a hunk conflict):

| Side | Customer list API |
|------|-------------------|
| Main | `listAll(tenantId)` |
| Snapshot | `findAll(tenantId)` (+ M0/M1 adds `findPage`) |

| Side | Quotation extras |
|------|------------------|
| Main | `findLatestByLeadId` |
| Snapshot | `findByCustomerId`, `findAll` (+ M0/M1 `findPage`) |

---

## 6. Business-logic / architecture conflicts (non-mechanical)

These will **not** always show as `<<<<<<<` but will break product coherence if both sides are kept naively.

### 6.1 Dual frontend products under `apps/web`

| Dimension | Snapshot (`91feb7b` + M0/M1) | `origin/main` |
|-----------|------------------------------|---------------|
| Stack | **Next.js 15** Admin Portal (`@eventos/web` 1.0.0-rc1) | **Vite + React Router** UAT SPA (`@event-os/web` 0.1.0) |
| Contract | OpenAPI-generated types | Hand-rolled domain types |
| Evidence of M0/M1 | Quotation line items, list hubs, Playwright | Absent |

**Resolution policy:** Prefer snapshot Next portal. Treat Vite UAT as archival or relocate (e.g. `apps/web-uat/`) only if founders still need it — **do not** merge package.json by concatenation.

### 6.2 Dual auth stacks

| Snapshot | Main |
|----------|------|
| `apps/api/src/modules/auth/**` (DDD, HIBP, password history, RBAC, throttle) | `apps/api/src/auth/**` (UAT JWT/cookies/guards) |
| Snapshot deleted legacy `src/auth` module entry | Main continues to evolve `src/auth` |

**Resolution policy:** Prefer `modules/auth`. Do not resurrect `src/auth` beside it without an explicit dual-auth ADR (out of scope / high risk).

### 6.3 Dual HTTP presentation layers

| Snapshot | Main |
|----------|------|
| Per-module controllers (`booking.controller`, `quotation.controller`, …) + OpenAPI | Additional `modules/presentation/*` Sprint-1 facade + modular controllers after merge |
| Frozen OpenAPI present | **No** `openapi.v1.json` on main |

**Resolution policy:** Keep modular + OpenAPI. Port missing **behaviors** from presentation facade (if any still unique) rather than importing the facade wholesale.

### 6.4 Dual Prisma migration lineages

| Snapshot migrations (selected) | Main-only migrations |
|--------------------------------|----------------------|
| Jul R-series + P2-01…P2-09 (auth sessions, contacts, suggestions, finance docs, …) | `20260912133000_sprint1_w5_payments_line_items_suggestions` |
| Schema models ≈ **54** | `20260912143000_contacts`, `20260912150000_auth_sessions` |
| | Schema models ≈ **23** |

Main’s September migrations appear to be a **parallel thinner evolution** of concerns already covered earlier on the snapshot line (contacts, auth sessions, payments/line items/suggestions).

**Resolution policy:** **Do not** concatenate both migration histories onto one database without a schema equivalence audit. Prefer snapshot migration chain as source of truth; if main Sep SQL contains unique columns/indexes, port via a **new forward migration** authored against snapshot schema — never replay conflicting historical folders blindly.

### 6.5 Suggestions / PDF / integration tests

| Capability | Snapshot | Main |
|------------|----------|------|
| Suggestions | `modules/admin` suggestion stack + e2e | `modules/suggestion` + presentation controller |
| Quotation PDF helpers | **Absent** under `shared/pdf` | **Present** (`minimal-quotation-pdf`, line extractors) |
| W5 / auth integration Jest | Snapshot has broader e2e set; **no** `test/integration/w5.integration-spec.ts` | Present |
| CI workflow | `pull-request.yml` / `main-branch.yml` | `ci.yml` |

**Port candidates from main (after approval):** PDF helpers + tests; selected W5 integration assertions; CI job ideas merged into existing workflows — **not** the Vite app or `src/auth`.

---

## 7. Dependency of M0/M1 on snapshot-only history

M0/M1 **requires** `91feb7b` (and is currently only applied as WT on top of it):

| M0/M1 capability | Depends on snapshot-only asset? |
|------------------|----------------------------------|
| Admin Portal UI workflows | Yes — Next portal from `91feb7b` |
| OpenAPI regen / generated types | Yes — `openapi.v1.json` absent on main |
| Modular permissions / auth | Yes — `modules/auth` |
| Quotation line-item + list/page APIs | Built on snapshot modular quotation/booking/customer modules |
| Playwright against portal routes | Yes — Next routes (`/app/...`) |

M0/M1 does **not** require `c00d3be` / `a6034b7` to function on the snapshot tip. Those commits are **optional value** (UAT SPA, PDF, some tests, alternate CI), not runtime prerequisites for the completed milestone.

---

## 8. UAT work on main missing from snapshot

Must be treated as **product decisions**, not automatic merges:

1. Vite UAT Admin (`apps/web/**` on main) — superseded by Next portal for release intent.
2. Legacy `apps/api/src/auth/**` — superseded by modular auth.
3. `apps/api/src/modules/presentation/**` facade — superseded by modular controllers + OpenAPI.
4. `apps/api/src/shared/pdf/**` — **unique; worth porting**.
5. `apps/api/test/integration/{auth,w5}.integration-spec.ts` — **worth evaluating/porting**.
6. Root `package.json` + `pnpm-workspace.yaml` monorepo glue — snapshot tip has no root package in tree; decide workspace layout deliberately.
7. `.github/workflows/ci.yml` — reconcile with snapshot’s PR/main workflows.
8. Sep-2026 Prisma migrations — **do not apply blindly**; audit vs snapshot schema.

---

## 9. Safe reconciliation strategy (proposed — awaiting approval)

### 9.1 Recommended strategy: “Snapshot-first release branch + selective port”

**Do not rebase** the 875-file snapshot onto main (history rewrite, painful conflict storm, worse reviewability).

**Do not merge main into dirty WT.**

Ordered steps (each requires explicit approval before execution):

1. **Hygiene / commit gate (snapshot lineage)**  
   - Confirm ignore rules for Playwright artifacts.  
   - Commit M0/M1 (+ docs) onto a new branch cut from `91feb7b`, e.g. `release/m0-m1-core-workflows`.  
   - Leave `snapshot/2026-11-04-wip` intact as historical tip.

2. **Create integration branch**  
   - `git checkout -b release/reconcile-main-uat` from the M0/M1 commit tip.

3. **Merge `origin/main` into the integration branch** (merge commit, not rebase)  
   - Resolve mechanical conflicts with policy:  
     - **Prefer snapshot** for: `apps/web/**` (Next), `modules/auth`, OpenAPI, modular controllers, seed aligned to modular auth, health/main bootstrap of snapshot.  
     - **Prefer / port main** only for: PDF helpers, valuable integration tests, CI ideas, any truly unique schema columns discovered in audit.  
     - **Drop / do not revive:** Vite SPA as `apps/web`, `src/auth`, `modules/presentation` facade, Sep migrations folders unless schema audit proves gaps.

4. **Schema equivalence audit (blocking)**  
   - Diff `schema.prisma` and migration folders.  
   - If main Sep migrations add anything absent from snapshot P2/R chain, author a **new** forward migration on the release branch.

5. **Selective cherry-picks / file ports** (if merge noise is too high)  
   Alternative to a full merge: skip merging main entirely; cherry-pick or copy only PDF + tests + CI fragments onto the snapshot release branch. This is **safer** if founders accept that Vite UAT and legacy auth remain archived on `origin/main` only.

6. **Open PR into `main`** from the release branch after green gates (section 10).  
   - Expect a large PR; summarize architecture preference (Next + modular auth) in PR body.

### 9.2 Explicitly rejected (without separate founder decision)

| Action | Why rejected |
|--------|----------------|
| Reset snapshot to main | Destroys portal / M0/M1 lineage |
| Force-push either branch | History loss; release protocol forbid |
| Rebase `91feb7b` onto main | Equivalent conflict surface; rewrites published snapshot SHA |
| “Keep both” frontends in `apps/web` | Guaranteed package/tsconfig/runtime failure |
| Apply both migration histories as-is | High chance of failed migrate / duplicate objects |

### 9.3 Alternative (lower merge risk)

If the only desired main artifacts are PDF + a few tests:

1. Commit M0/M1 on snapshot child.  
2. **Do not merge main.**  
3. Manually port `shared/pdf` + selected tests.  
4. Push release branch and open PR that **replaces** main’s tip with snapshot lineage (still a merge/PR, but conflict set is chosen, not forced).

This is the **safest engineering path** when UAT SPA is already obsolete.

---

## 10. Required regression after reconciliation

Minimum gate before calling the release branch mergeable:

| Gate | Command / check |
|------|-----------------|
| API unit | `cd apps/api && pnpm test` — expect ≥ 705 green |
| API lint/build | `pnpm lint && pnpm build` |
| OpenAPI export + web generate | `pnpm openapi:export` → `cd apps/web && pnpm openapi:generate` |
| Web unit | `pnpm test` — expect ≥ 121 green |
| Web typecheck | `pnpm typecheck` |
| Web build | `pnpm build` |
| Prisma migrate status | Against a **scratch** DB cloned from snapshot chain; never production |
| Auth smoke | Login with seeded `SEED_ADMIN_PASSWORD` against modular auth |
| Live Playwright | `E2E_ADMIN_PASSWORD=… pnpm test:e2e` with API+web up — convert current skip into pass |
| Manual UAT checklist | Lead → follow-up → quote lines → send → advance → approve → prep → execution → complete → profitability |
| Conflict review | Re-run `git merge-tree` mentally via PR file list; confirm no dual `apps/web` stacks |

Optional / recommended:

- Ported PDF unit tests green  
- Ported W5 integration specs adapted to modular controllers (rewrite imports; do not assume `modules/presentation`)  
- CI workflow dry-run on the PR

---

## 11. Recommended release branch

| Recommendation | Branch | Base |
|----------------|--------|------|
| **Primary** | `release/m0-m1-core-workflows` | `91feb7b` + **committed** M0/M1 |
| Integration (if merging main) | `release/reconcile-main-uat` | Primary after M0/M1 commit |
| Do **not** release from | Dirty `snapshot/2026-11-04-wip` WT | — |
| Do **not** release from | Raw `origin/main` alone | Missing portal + M0/M1 |

**Promotion target:** `origin/main` via PR after gates — with PR description stating that Next Admin Portal + modular auth **supersede** Vite UAT + `src/auth`.

---

## 12. Risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Uncommitted M0/M1 lost or mixed into conflict resolution | Critical | Commit/stash first under approval |
| Dual `apps/web` after merge | Critical | Prefer snapshot; relocate or drop Vite |
| Dual auth modules | Critical | Prefer `modules/auth`; delete/ignore `src/auth` |
| Prisma migration collision | Critical | Schema audit; forward-only new migration |
| Auto-merged repo methods with dual names (`listAll` vs `findAll`) | High | Explicit method consolidation in review |
| Assuming main UAT “newer” because Sep dates | Medium | Snapshot tip is Nov and schema-superset; date ≠ authority |
| Playwright still skipped | Medium | Seed password + live stack before release sign-off |
| BullMQ unused dep | Low | Remains quarantined; out of reconciliation scope |

---

## 13. Approval checklist (stop here)

No further git mutation until an approver confirms:

- [ ] Commit M0/M1 (+ docs; exclude Playwright report artifacts) on a child of `91feb7b`
- [ ] Choose strategy: **(A)** selective port only **or** **(B)** merge `origin/main` with snapshot-preference conflict policy
- [ ] Confirm Vite UAT SPA is **not** the release frontend
- [ ] Confirm modular auth is **the** auth stack
- [ ] Authorize Prisma schema audit before any migration replay
- [ ] Authorize push of release branch + PR creation

---

## 14. Evidence commands used (read-only)

```bash
git fetch origin
git status -sb
git rev-list --left-right --count origin/main...HEAD
git merge-base origin/main HEAD
git log --oneline origin/main..HEAD
git log --oneline HEAD..origin/main
git diff --name-only b6b158a..origin/main
git diff --name-only b6b158a..HEAD
git merge-tree --write-tree HEAD origin/main   # conflict inventory; no checkout
```

---

*End of read-only reconciliation audit. Awaiting approval before any git write operation.*
