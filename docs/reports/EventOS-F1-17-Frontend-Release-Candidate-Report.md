# Event OS — F1-17 Frontend v1.0 Release Candidate Report

| Field | Value |
|-------|-------|
| **Task** | F1-17 — Frontend v1.0 Release Candidate |
| **Package** | `@eventos/web@1.0.0-rc1` |
| **Date** | 2026-07-13 |
| **Backend** | `1.0.0-rc1` + frozen OpenAPI |
| **Prior gate** | F1-16 READY WITH MINOR ISSUES |

---

## 1. Executive Summary

Final RC validation for the Admin Portal completed. **RBAC frontend mirror matches backend exactly** (9 roles, 58 permissions, identical role maps). All feature API clients call paths present in frozen OpenAPI. **`pnpm validate` passed** (115 tests, static export, 47 routes).

No RC-blocking defects found. Only change for RC prep: package version set to **`1.0.0-rc1`**.

Live interactive smoke against a running API was **not available** in this environment (localhost API/web returned no response). Auth/API contracts remain covered by unit tests; founder FAT must complete live smoke.

**Verdict: APPROVED FOR RC1** (confidence **92%**).

---

## 2. Validation Performed

| Area | Method | Result |
|------|--------|--------|
| RBAC parity | Programmatic diff `apps/api/.../rbac.ts` ↔ `apps/web/.../rbac.ts` | **Identical** |
| OpenAPI conformance | Inventory of `*.api.ts` paths vs `openapi.v1.json` | **All matched** |
| Build / quality | `pnpm validate` | **Pass** |
| Environment design | `.env.example`, `env.ts`, API cookie/CORS code review | **Ready** (host config required) |
| Deferred gaps | Cross-check F1-16 list | **Documented intentional** |
| Live smoke | curl localhost:3000 / 3001 | **Blocked** (servers not running) |

---

## 3. Files Changed

| File | Change |
|------|--------|
| `apps/web/package.json` | Version `0.1.0` → **`1.0.0-rc1`** |

No feature, RBAC, or API client code changes (no drift to fix).

---

## 4. Build Status

**PASS**

- `pnpm typecheck` ✅  
- `pnpm lint` ✅  
- `pnpm build` ✅ (`output: 'export'`, trailing slash, 47 static pages)  
- Artifact: `apps/web/out/`

---

## 5. Test Status

**PASS** — 28 files / **115** tests.

Coverage emphasis: API clients, Zod schemas, RBAC helpers, auth store. Guard/e2e UI still thin (noted in F1-16; non-blocking for RC1).

---

## 6. Smoke Test Results

| Check | Result | Notes |
|-------|--------|-------|
| Static routes present in export | **Pass** | login, dashboard, all F1 hubs, settings, security, forbidden/unauthorized |
| Auth API unit paths | **Pass** | login / refresh / logout / change-password |
| Nav permission filtering | **Pass** (unit) | sales lacks dashboards/settings; security ungated |
| Live login → module walk | **Not executed** | No local API (`:3000`) / web (`:3001`) responding |
| Password change / refresh cookie live | **Deferred to FAT** | Backend implements Secure+SameSite=Strict on deployed tiers |

**FAT required** before production: login, refresh, logout, password change, and one happy path per module.

---

## 7. OpenAPI Conformance

| Check | Result |
|-------|--------|
| Undocumented FE endpoints | **None** found in feature `*.api.ts` |
| Invented list endpoints | **None** (`GET /clients|/quotations|/bookings` not called) |
| `If-Match` on mutating resources | Present on settings, clients, quotations, bookings, vendors, staff, inventory, finance voids |
| Inventory transition | Uses `toStatus` |
| Finance writes | Flat money fields |
| Dashboard | All 13 `/dashboards/*` consumed across F1-04 + F1-14 |

---

## 8. RBAC Verification

| Check | Result |
|-------|--------|
| Permission keys | **58 = 58** identical |
| Roles | **9 = 9** identical |
| Role → permission maps | **Identical** (incl. empty `marketing`) |
| Frontend-only permissions | **None** |
| Backend-only permissions | **None** (relative to mirror) |

**No frontend RBAC fix required.**

---

## 9. Environment Verification

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | Validated via Zod (`env.ts`); documented in `.env.example` |
| Secrets in web bundle | **None** (public env only) |
| Static export | Confirmed (`next.config.ts` `output: 'export'`) |
| HTTPS | **Host responsibility** for production static + API |
| Refresh cookie Secure / SameSite | **API** sets Strict+Secure on staging/production; Lax+non-Secure in local HTTP |
| Cookie path | `/api/v1/auth` (ADR-008) |
| CORS | **API** requires explicit non-wildcard `CORS_ORIGIN` outside development |
| `withCredentials` | Enabled on web Axios client |

**RC note:** Production deploy must set web origin in API `CORS_ORIGIN` and build web with the production API URL.

---

## 10. Release Candidate Verdict

### **APPROVED FOR RC1**

**Confidence: 92%**

Residual 8%: live FAT smoke not run in this session; hosting CORS/cookie cutover is operational (not a code defect).

---

## 11. Final Release Metrics

| Metric | Value |
|--------|-------|
| Backend version | `1.0.0-rc1` |
| Frontend version | `1.0.0-rc1` |
| Frozen OpenAPI paths | 87 |
| Dashboard APIs | 13 (all consumed) |
| Frontend feature modules | 13 (`auth` … `workspace` + reports/settings) |
| F1 milestones | F1-01 – F1-17 |
| Documentation sync | R3-12 + R4-01 complete |
| OpenAPI drift (FE invents) | **0** |
| RBAC drift | **0** |
| Unit tests | 115 pass |
| Build | Pass |
| Static app routes (export) | 47 |

---

## 12. Suggestions / Next Steps

1. **Create git tag** for frontend RC (e.g. `web-v1.0.0-rc1` / monorepo tag per team convention) after commit of version bump  
2. **Founder Acceptance Testing (UAT)** — live smoke + intentional-gap acknowledgment  
3. **Production deployment** — static `out/` + API CORS/cookie alignment  
4. **Event OS Phase 1 v1.0 release** after FAT sign-off  
5. Post-launch: optional lazy-load Reports charts; shared RBAC package

### Intentional deferred items (not bugs)

Quote PDF · quotation line-item UI · procurement UI · tasks UI · suggestions UI · staff-assignments UI · inventory photos/packing · reports export · branding · settings Team/Templates/Integrations · contacts/timeline UI · list endpoints not in OpenAPI

---

## Release Candidate Checklist

- [x] Build  
- [x] Tests  
- [x] OpenAPI  
- [x] Permissions (RBAC parity)  
- [x] Documentation sync (prior R3-12 / R4-01)  
- [x] Environment design verified (deploy config pending ops)  
- [x] Deferred items documented  
- [ ] Live smoke / FAT (founder)  

---

*Report owner: Founding Engineering*  
*Generated: 2026-07-13 (F1-17)*
