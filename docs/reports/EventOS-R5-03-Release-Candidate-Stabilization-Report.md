# Event OS — R5-03 Release Candidate Stabilization Report

| Field | Value |
|-------|-------|
| **Task** | R5-03 — Release Candidate Stabilization |
| **Date** | 2026-07-19 |
| **Backend** | `1.0.0-rc1` (no API / OpenAPI / schema changes) |
| **Frontend** | `1.0.0-rc1` quality pass |
| **Production deploy** | Intentionally deferred |
| **Authority** | Frozen OpenAPI + approved Phase 1 scope |

---

## 1. Executive Summary

Stabilized the Admin Portal RC without expanding Phase 1 scope. The highest-impact fix was **post-login / home redirects**: roles without `dashboards:read` were sent to Dashboard and immediately hit `/forbidden`. Additional fixes aligned Events permissions, restored missing open-by-id hub flows, hardened UUID navigation, gated Settings in the user menu, and improved ops KPI failure isolation plus Reports chart code-splitting.

**Verdict: APPROVED WITH MINOR NOTES**

---

## 2. Bugs Fixed

### Critical

| ID | Issue | Fix |
|----|-------|-----|
| RC-C1 | Login / `/` / `/app` always redirected to `/app/dashboard/` → forbidden for sales, ops, finance, marketing, coordinator | `resolveDefaultAppHref()` → first allowed `MAIN_NAV` leaf |

### High

| ID | Issue | Fix |
|----|-------|-----|
| RC-H1 | Events nav/hub allowed `bookings:read` but workspace page requires `workspace:read` | Nav + hub gated on `workspace:read` only |
| RC-H2 | Customers hub claimed open-by-id but had no form | Added UUID open form → `/app/customers/view/?id=` |
| RC-H3 | Quotations hub same gap | Added UUID open form → `/app/quotations/view/?id=` |
| RC-H4 | Ops snapshot blanked entire widget if any of 6 queries failed | Independent KPI rendering + Retry failed |
| RC-H5 | Header Settings always linked to `/app/settings/` | `settings:read` gate + always-available Security link |
| RC-H6 | Breadcrumb Home / forbidden / not-found / sidebar brand → dashboard | Point to `/app/` (permission-aware redirect) |

### Medium

| ID | Issue | Fix |
|----|-------|-----|
| RC-M1 | Hub open-by-id accepted any string | Shared `OpenByIdForm` + `parseUuidInput` |
| RC-M2 | Quick actions pointed at hubs, not `/new/` | Updated create hrefs + copy |
| RC-M3 | Reports first-load ~301 kB (Recharts) | `next/dynamic` for monthly revenue section → ~203 kB route |

### Low

None separately tracked beyond shared form extraction.

*(Prior session local CORS/Helmet CORP fix in `apps/api/src/main.ts` remains in tree for cross-origin Admin Portal ↔ API — deployment hygiene, not a new feature.)*

---

## 3. UX Improvements

- Permission-aware landing after sign-in
- Open-by-id on Customers / Quotations hubs (parity with Bookings / Events / Finance)
- UUID validation toast before navigation
- Ops metrics remain visible when a subset of endpoints fail
- User menu: Settings gated; Security always available
- Quick actions open create forms where they exist
- Home links no longer force Dashboard for restricted roles
- Reports chart loads lazily with a loading state

---

## 4. Technical Debt Reduced

- `resolveDefaultAppHref` + unit tests (nav-driven landing)
- Shared `OpenByIdForm` + `parseUuidInput`
- Hub pages consolidated onto shared open-by-id control
- Reports Recharts code-split

**Deferred (noted, not blocking):** frontend RBAC mirror of API; large booking-detail split; shared `DetailField`; inventory GET-by-id (no API).

---

## 5. Validation

| Check | Result |
|-------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass — **118** tests (29 files; +3 for default-app-href) |
| `pnpm build` | Pass — Reports route **~203 kB** first load (was ~301 kB) |

---

## 6. Repository Status

| Constraint | Status |
|------------|--------|
| No Business Bible changes | Confirmed |
| No backend API / schema / OpenAPI changes | Confirmed |
| No Phase 1 scope expansion | Confirmed |
| Intentional gaps (tasks, procurements, Settings placeholders, etc.) | Unchanged — not treated as bugs |

---

## 7. Engineering Review Verdict

### **APPROVED WITH MINOR NOTES**

Ready to continue founder demos on local/staging RC. Remaining notes are non-blocking tech debt (RBAC package sharing, booking-detail split) and intentional Phase 1 gaps.

---

## 8. Suggestions / Next Steps

1. Optional **R5-03b** follow-up: RBAC parity CI check (web vs api), booking-detail split, inventory cache-first detail  
2. When ready for cloud: resume original **production deploy** track (provision → deploy → live FAT → sign-off → v1.0.0)  
3. Live Founder UAT can run on local/staging without production

---

*Report owner: Founding Engineering*  
*2026-07-19*
