# Event OS — R5-04 Release Candidate Quality Assurance & Regression Audit

| Field | Value |
|-------|-------|
| **Task** | R5-04 — RC Quality Assurance & Regression Audit |
| **Date** | 2026-07-19 |
| **Backend** | `1.0.0-rc1` |
| **Frontend** | `1.0.0-rc1` (+ R5-03 stabilization) |
| **Method** | Static route/RBAC audit + unit/build gates + live API/auth smoke + browser session smoke |
| **Code changed** | **None** (no verified product regressions requiring fixes) |

---

## 1. Executive Summary

RC1 remains stable after R5-03. All automated frontend gates pass (**118** tests). R5-03 stabilization fixes are still present. Web ↔ API RBAC matrices match. Live API auth (login → refresh → logout + CORS) passes. Browser smoke confirmed admin session restore → Dashboard KPIs / Ops snapshot / Quick actions, and Customers hub open-by-id UI.

No product defects requiring code changes were confirmed. One environmental issue (dev server `.next` corruption after `pnpm build` while `next dev` ran → HTTP 500) was resolved by clearing `.next` and restarting the portal — not an RC application bug.

**Verdict: APPROVED WITH MINOR NOTES**  
**RC Health Score: 93%**

---

## 2. Regression Audit Results

| Module | Result | Notes |
|--------|--------|-------|
| **Authentication** | **PASS** | Live login/refresh/logout OK; cookie + CORS OK; session restore to dashboard (admin) |
| **Navigation** | **PASS** | Permission-aware landing present; Home → `/app/`; Settings gated; Security ungated |
| **Dashboard** | **PASS** | Founder + Ops KPIs load; empty states OK; ops partial-failure design retained |
| **Customers** | **PASS** | Hub + create links + Open-by-ID form verified in browser |
| **Leads** | **PASS*** | Gated routes + create/list/view present in code; not fully exercised E2E this run |
| **Quotations** | **PASS*** | Hub Open-by-ID + lifecycle routes gated; not full lifecycle E2E |
| **Bookings** | **PASS*** | Hub + detail lifecycle gated `bookings:read` |
| **Event Workspace** | **PASS*** | Hub/workspace require `workspace:read` only (R5-03 fix held) |
| **Vendors** | **PASS*** | CRUD + issue-note routes gated |
| **Staff** | **PASS*** | CRUD gated |
| **Inventory** | **PASS*** | Items + movements + transitions gated; cold GET-by-id remains intentional gap |
| **Finance** | **PASS*** | Hub Open-by-ID + booking panels gated |
| **Reports** | **PASS*** | `dashboards:read`; MonthlyRevenue dynamic import present; route ~203 kB |
| **Settings** | **PASS*** | General `settings:read`; Security JWT-only; placeholders intentional |

\*PASS = no regression found in gates/structure; full founder walkthrough of every mutation remains recommended before live FAT.

Intentional Phase 1 gaps (no list APIs, no tasks/procurements UI, etc.) are **not failures**.

---

## 3. RBAC Verification

Web `ROLE_PERMISSIONS` matches API (diff = whitespace only).

| Role | Default landing | Dashboard | Settings | Events |
|------|-----------------|-----------|----------|--------|
| owner | `/app/dashboard/` | Yes | Yes | Yes |
| admin | `/app/dashboard/` | Yes | Yes | Yes |
| sales_manager | `/app/dashboard/` | Yes | No | No |
| sales | `/app/customers/` | No | No | No |
| operations_manager | `/app/customers/` | No | No | Yes |
| coordinator | `/app/customers/` | No | No | Yes |
| finance | `/app/leads/` | No | No | No |
| marketing | `/app/settings/security/` | No | No | No |
| viewer | `/app/dashboard/` | Yes | No | Yes |

- Direct URL access: module pages use `RequirePermission` / `anyOf` (Security intentionally JWT-only).
- No permission-leak defects verified.
- Finance landing on Leads is nav-order behavior (has `leads:read`) — **minor note**, not a leak.

---

## 4. UI / UX Findings

### Confirmed healthy
- Quick actions point to `/new/` where applicable
- Customers open-by-id + empty state
- Ops snapshot independent KPIs + Retry failed
- Breadcrumb Home → `/app/`
- Form labels present on audited hubs

### Minor notes (non-blocking)
- Duplicate Security entry (top-level + under Settings) for owner/admin
- Finance default landing = Leads (suboptimal for finance demos)
- Next.js Dev Tools “issues” badge can appear during local turbopack — environment noise
- Accessibility remains baseline (no axe CI)

---

## 5. Performance Review

| Metric | Observation |
|--------|-------------|
| Shared First Load JS | ~103 kB |
| Dashboard | ~203 kB first load |
| Reports | ~203 kB first load (was ~301 kB pre–R5-03 lazy chart) |
| Lazy loading | Monthly revenue chart via `next/dynamic` (`ssr: false`) |
| Opportunities | Booking detail split; further chart/vendor code-split; inventory cache-first detail |

---

## 6. Technical Debt Register

### High
None for RC ship readiness.

### Medium
| Item | Note |
|------|------|
| Frontend RBAC mirror of API | Add CI parity check before v1.0.0 |
| Inventory detail via list cache | No GET-by-id in OpenAPI |
| Hub-when-no-list UX | Intentional; demo friction |

### Low
| Item | Note |
|------|------|
| Settings placeholders | Intentional |
| marketing empty permission set | Intentional → Security-only shell |
| Duplicate Security nav | Cosmetic |
| Large booking-detail component | Deferred from R5-03 |
| Local `DetailField` duplication | Deferred |

---

## 7. Validation Results

| Check | Result |
|-------|--------|
| `pnpm typecheck` | **Pass** |
| `pnpm lint` | **Pass** |
| `pnpm test` | **Pass** — 29 files / **118** tests |
| `pnpm build` | **Pass** — static export |
| API `/health` + `/health/ready` | **Pass** (local) |
| Auth login → refresh → logout | **Pass** |
| CORS `Access-Control-Allow-Origin: http://localhost:3001` | **Pass** |
| Browser admin session + Dashboard + Customers hub | **Pass** |

---

## 8. Release Candidate Health Score

### **93%**

| Dimension | Weight | Score |
|-----------|--------|-------|
| Automated quality gates | 25% | 100% |
| R5-03 fix retention | 20% | 100% |
| RBAC / navigation | 20% | 95% |
| Live auth + smoke | 20% | 95% |
| Module E2E depth (mutations) | 15% | 70% |

Deductions: incomplete mutation E2E coverage this audit; residual medium debt / intentional gaps.

---

## 9. Engineering Verdict

### **APPROVED WITH MINOR NOTES**

RC1 is suitable for continued founder demos on local/staging. No blocking regressions. Production deploy remains deferred pending infrastructure.

---

## 10. Next Steps

1. Continue founder demos on local/staging as needed  
2. Optional R5-04b: deeper mutation E2E script (quote approve → booking → finance) before live FAT  
3. When infrastructure is ready, resume the **deployment track**:
   - Production Deployment  
   - Live Founder Acceptance Testing  
   - Founder Sign-off  
   - Event OS v1.0.0 Production Release  

---

## Appendix — Environmental note (not a product defect)

During this audit, `pnpm build` while `next dev` was running left a corrupted `apps/web/.next`, causing `/login` HTTP 500 (`ENOENT` build manifests). Cleared `.next` and restarted `pnpm dev` → recovered. Operators should avoid concurrent production build + turbopack on the same tree, or restart the portal after a full build.

---

*Report owner: Founding Engineering*  
*2026-07-19*
