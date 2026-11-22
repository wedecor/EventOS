# Event OS — F1-03 Application Shell & Navigation Report

| Field | Value |
|-------|-------|
| **Feature** | Application shell, navigation, page framework |
| **Requested by** | User (F1-03) |
| **EP1 Requirements** | N/A — shell only (no business EP1 screens) |
| **Scope** | Responsive shell, sidebar/header, breadcrumbs, placeholders, page kit |
| **Explicitly out of scope** | Dashboard widgets, CRM, quotations logic, any business API writes |

---

## 1. Executive Summary

Completed a production-oriented **Application Shell** on top of F1-01/F1-02:

- Responsive layout (desktop sidebar, tablet collapse, mobile sheet)
- Hierarchical, iconized, permission-aware navigation (docs/17-aligned grouping)
- Sticky header with breadcrumbs, notifications placeholder, theme toggle, user menu + logout confirm
- Automatic breadcrumbs from the route path (nested + dynamic-ready)
- Shared page framework (`PageLayout`, `PageHeader`, `PageActions`, `PageSection`, `ContentCard`, empty/loading/error states)
- Placeholder routes for all listed modules (no business logic)

---

## 2. Files Changed

### Created (key)

- `src/shared/config/navigation.ts` (rewritten IA)
- `src/shared/config/nav-icons.ts`
- `src/shared/lib/breadcrumbs.ts`
- `src/shared/lib/breadcrumbs.spec.ts`
- `src/shared/components/layout/sidebar-nav.tsx`
- `src/shared/components/page/*` (layout, header, section, card, states, module placeholder, index)
- `src/shared/components/ui/{dropdown-menu,avatar,sheet}.tsx`
- Placeholder routes under `src/app/app/{dashboard,customers,leads,quotations,bookings,events,staff,vendors,inventory,finance,reports,settings/**}/page.tsx`
- `EventOS-F1-03-Application-Shell-Report.md`

### Modified

- `sidebar.tsx`, `header.tsx`, `app-shell.tsx`, `page-container.tsx`
- `use-ui-store.ts` (mobile nav + expanded groups, persist)
- `filter-nav.ts` (nested + `anyOf` + active helpers)
- Auth redirect targets → `/app/dashboard/`
- Tests updated for new nav shape

### Deleted

- `src/app/app/permission-demo/page.tsx` (temporary F1-02 demo)

---

## 3. Implementation

### Layout architecture

`AppShell` = desktop `Sidebar` + sticky `Header` + scrollable `main`. Mobile uses a left `Sheet` with the same `SidebarNav`. Sidebar collapsed width persists via Zustand.

### Navigation system

`MAIN_NAV` supports icons, nested groups (Operations, Settings), `permission` / `anyOf` gates using backend RBAC keys only. Leaves navigate to placeholder pages.

### Header

User avatar dropdown (profile soon, settings link, sign out), theme toggle, disabled notifications placeholder, sticky breadcrumbs (sm+), page title on small screens.

### Breadcrumbs

`buildBreadcrumbs(pathname)` maps segments via `ROUTE_TITLES`, supports UUID shortening and `currentTitle` overrides for future entity pages.

### Route organization

`/app` → redirects to `/app/dashboard/`. Each module route uses `ModulePlaceholderPage` + optional `RequirePermission`.

### Permission integration

Nav filtering recursive; page-level `RequirePermission` → `/forbidden` when lacking access.

### Shared page framework

Reusable building blocks for all future modules under `@/shared/components/page`.

---

## 4. Validation

| Area | Result |
|------|--------|
| Layout / sticky header / collapse | Implemented; verified via build routes + unit helpers |
| Responsive (md sidebar / mobile sheet) | Implemented |
| Breadcrumb generation | Unit tests pass |
| Permission-aware nav | Unit tests (sales vs operations_manager vs finance) |
| Logout from header | Confirm dialog retained from F1-02 |
| Active highlighting | `isNavActive` unit tests |

---

## 5. Build Status

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** (unused import fixed) |
| `pnpm build` | **PASS** (23 static routes) |

---

## 6. Test Status

| Metric | Value |
|--------|-------|
| Vitest | **24 passed** (5 files) |
| New coverage | breadcrumbs, nested nav filter, `anyOf`, active state |

---

## 7. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Scalable for Phase 1 modules | **Yes** |
| Consistent with F1-01/F1-02 | **Yes** |
| No invented permissions / APIs | **Yes** |
| Suitable foundation for business modules | **Yes** |

**Verdict: APPROVE** — Application Shell ready for F1-04 Dashboard.

---

## 8. Known Limitations

1. Placeholder pages only — no business data or widgets.
2. **Customers** UI label maps to API `clients:*` permissions (documented).
3. **Reports** has no Phase 1 `reports:*` permission — visible to all authenticated users.
4. Notifications / Profile menu items are intentional stubs.
5. docs/17 also lists Calendar, Tasks, Marketing — not in F1-03 list; deferred.
6. Search in header (docs/17) not implemented — deferred to shell polish / command palette later.

---

## 9. Suggestions / Next Steps

1. **F1-04 — Dashboard** (first real business screen against frozen dashboard APIs)
2. Then Customer / Lead modules per Business Bible
3. Optional: add header search / command palette (docs/17)
4. Optional: sync docs/10 SPA structure wording with App Router shell (docs task)
