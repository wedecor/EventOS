# Event OS — F1-15 Settings Report

| Field | Value |
|-------|-------|
| **Feature** | Tenant Settings + Change Password (Option 2) |
| **Requested by** | User (F1-15) — Option 2 approved after API vs docs review |
| **EP1 Requirements** | EP1-KPI-007 (selective target storage); auth self-service password change |
| **Scope** | `/app/settings/` tenant GET/PATCH; `/app/settings/security/` change-password |
| **Explicitly out of scope** | Branding, feature flags, notifications, profile/`/me`, Team/Templates/Integrations CRUD, invented settings APIs |

---

## 1. Executive Summary

Implemented **Option 2**:

1. **Tenant settings** — read/edit `businessName` + five nullable KPI targets via `GET/PATCH /api/v1/settings` (`settings:read` / `settings:write`, `If-Match`)
2. **Change password** — `POST /api/v1/auth/change-password` for any authenticated user; clears local session after backend session revoke

Team / Templates / Integrations remain **placeholders**. `pnpm validate` passed.

---

## 2. Files Changed

### Created

- `src/features/settings/schemas/settings.schemas.ts` (+ `.spec.ts`)
- `src/features/settings/api/settings.api.ts` (+ `.spec.ts`)
- `src/features/settings/hooks/use-settings-queries.ts`
- `src/features/settings/components/tenant-settings-form.tsx`
- `src/features/settings/components/settings-general-page.tsx`
- `src/features/settings/components/change-password-form.tsx`
- `src/features/settings/components/settings-security-page.tsx`
- `src/features/settings/index.ts`
- `src/app/app/settings/security/page.tsx`
- `EventOS-F1-15-Settings-Report.md`

### Modified

- `src/app/app/settings/page.tsx` — General tenant settings page
- `src/features/auth/api/auth.api.ts` — `changePassword`
- `src/features/auth/api/auth.api.spec.ts`
- `src/features/auth/schemas/auth.schemas.ts` — change-password form schema
- `src/features/auth/schemas/auth.schemas.spec.ts`
- `src/shared/config/navigation.ts` — Security top-level + under Settings; shield icon
- `src/shared/config/nav-icons.ts` — `shield`
- `src/shared/lib/breadcrumbs.ts` — `security` title
- `src/shared/lib/breadcrumbs.spec.ts` — sales sees Security without Settings

---

## 3. Implementation

### Tenant settings

- Feature module `features/settings/`
- Zod-parse OpenAPI envelopes; PATCH with `If-Match: "<version>"`
- Read-only UI when user lacks `settings:write`
- Empty target fields map to `null` (clear)

### Change password

- Auth API client method; confirm field is client-only
- On success: toast → `clearSession('logout')` → `/login/` (matches backend revoke-all-sessions)

### Navigation

- Top-level **Security** (no permission) so roles without `settings:read` can still change password
- Settings group still owner/admin; includes Security + deferred placeholders

### Shared reuse

PageLayout / PageHeader / ContentCard / Form kit / Can / RequirePermission / toasts

---

## 4. Settings Coverage Verification

| Capability | Frozen API | F1-15 | Notes |
|------------|------------|-------|-------|
| Tenant business name | `GET/PATCH /settings` | Yes | |
| KPI targets (EP1-KPI-007) | Same | Yes | Nullable; no invented defaults |
| Change password | `POST /auth/change-password` | Yes | JWT only |
| Team / Templates / Integrations | None | Placeholder | Deferred |
| Branding / prefs / profile | None | Out of scope | |

---

## 5. Validation

| Gate | Result |
|------|--------|
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass (115 tests) |
| `pnpm build` | Pass (`/app/settings`, `/app/settings/security`) |

---

## 6. Build Status

**PASS** — static export includes Settings General and Security routes.

---

## 7. Test Status

**PASS** — settings schema/API tests, auth change-password client/form tests, nav permission tests.

---

## 8. Engineering Review Verdict

**APPROVED** — aligned with frozen OpenAPI:

- Only documented settings fields
- Permissions `settings:read` / `settings:write` for tenant settings
- Password change without inventing `settings:*` / `reports:*`
- No Team/Templates/Integrations invention

---

## 9. Known Backend Limitations

Not bugs:

| Limitation | Status |
|------------|--------|
| Branding / logos / theme | Absent |
| Feature flags / notifications / user prefs | Absent |
| Profile / `/me` | Absent |
| Settings Team admin API | Absent (use Staff master) |
| Templates / integrations settings | Absent |
| Founder-approved target values | Business TBD — API stores nulls/numbers only |

---

## 10. Suggestions / Next Steps

1. **F1-16 — Frontend Production Readiness Review**
2. **F1-17 — Frontend v1.0 Release Candidate**
3. Founder Acceptance Testing
4. Event OS v1.0 Production Release

Optional later: remove or hide Team/Templates/Integrations nav until APIs exist.

---

*Report owner: Founding Engineering*  
*Generated: 2026-07-13 (F1-15)*
