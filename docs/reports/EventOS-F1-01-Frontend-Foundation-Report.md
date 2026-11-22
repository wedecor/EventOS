# Event OS — F1-01 Frontend Foundation & Architecture Report

| Field | Value |
|-------|-------|
| **Feature** | Admin Portal foundation scaffold (`apps/web`) |
| **Requested by** | User (F1-01) |
| **EP1 Requirements** | N/A — architecture / tooling only (no business EP1 screens) |
| **Scope** | Next.js 15 client-first static export, shared UI/API/auth foundation |
| **Explicitly out of scope** | CRM, Dashboard, Customers, Leads, Events, Vendors, Finance, Inventory, Staff screens; ADR/docs edits |

---

## 1. Executive Summary

Scaffolded **`apps/web`** as the Event OS Admin Portal foundation: Next.js 15 App Router + React 19, **static export** (`output: 'export'`), Tailwind + shadcn-style primitives, TanStack Query, Axios API client bound to the frozen OpenAPI contract, and auth wiring (login / refresh cookie / logout / protected client routes / role→permission UI gating).

No business modules were implemented. NestJS remains the only backend; no SSR, Server Actions, or Route Handlers were introduced.

---

## 2. Files Created

### Config / toolchain

- `apps/web/package.json`
- `apps/web/pnpm-lock.yaml`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/next-env.d.ts`
- `apps/web/postcss.config.mjs`
- `apps/web/eslint.config.mjs`
- `apps/web/.prettierrc`
- `apps/web/.prettierignore`
- `apps/web/.gitignore`
- `apps/web/.env.example`
- `apps/web/.env.local` (local only; not for commit)
- `apps/web/components.json`
- `apps/web/README.md`

### App Router

- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/loading.tsx`
- `apps/web/src/app/error.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/app/layout.tsx`
- `apps/web/src/app/app/page.tsx`

### Providers / lib / types / services / hooks

- `apps/web/src/providers/app-providers.tsx`
- `apps/web/src/providers/query-provider.tsx`
- `apps/web/src/providers/theme-provider.tsx`
- `apps/web/src/providers/error-boundary.tsx`
- `apps/web/src/lib/utils.ts`
- `apps/web/src/lib/env.ts`
- `apps/web/src/styles/globals.css`
- `apps/web/src/types/api.generated.ts` (from `openapi.v1.json`)
- `apps/web/src/types/index.ts`
- `apps/web/src/services/api.ts`
- `apps/web/src/hooks/index.ts`
- `apps/web/src/components/index.ts`
- `apps/web/src/features/index.ts`
- `apps/web/tests/unit/.gitkeep`

### Auth feature

- `apps/web/src/features/auth/index.ts`
- `apps/web/src/features/auth/types/auth.types.ts`
- `apps/web/src/features/auth/api/auth.api.ts`
- `apps/web/src/features/auth/hooks/use-auth-store.ts`
- `apps/web/src/features/auth/hooks/use-auth.ts`
- `apps/web/src/features/auth/components/auth-bootstrap.tsx`
- `apps/web/src/features/auth/components/login-form.tsx`

### Shared foundation

- `apps/web/src/shared/api/client.ts`
- `apps/web/src/shared/api/query-client.ts`
- `apps/web/src/shared/types/api.ts`
- `apps/web/src/shared/auth/rbac.ts`
- `apps/web/src/shared/config/navigation.ts`
- `apps/web/src/shared/hooks/use-ui-store.ts`
- `apps/web/src/shared/components/ui/{button,input,label,dialog,card,separator,skeleton}.tsx`
- `apps/web/src/shared/components/layout/{app-shell,sidebar,header,breadcrumbs,page-container,protected-route}.tsx`
- `apps/web/src/shared/components/feedback/{page-loader,toaster,confirm-dialog}.tsx`
- `apps/web/src/shared/components/data-display/{data-table,empty-state,loading-skeleton,pagination}.tsx`
- `apps/web/src/shared/components/forms/form.tsx`
- `apps/web/src/shared/components/charts/index.ts`

**Backend:** no API or docs files modified.

---

## 3. Architecture

### Folder structure

Feature-first under `src/`:

- `app/` — routes only (login, protected `/app` shell home)
- `features/` — feature modules (auth only for F1-01)
- `shared/` — UI kit, API client, RBAC projection, navigation catalog
- `providers/` — app-wide providers
- `lib/`, `hooks/`, `services/`, `types/`, `styles/`, `components/` — cross-cutting entry points

### Shared layers

| Layer | Responsibility |
|-------|----------------|
| UI primitives (`shared/components/ui`) | shadcn-style Button, Input, Dialog, etc. |
| Layout | AppShell, Sidebar, Header, Breadcrumbs, PageContainer |
| Data display | DataTable (TanStack Table), Pagination, EmptyState, skeletons |
| Feedback | Toasts (Sonner), ConfirmDialog, PageLoader, ErrorBoundary |
| Forms | RHF + Zod helpers |
| API | Single Axios `apiClient` + TanStack Query client |
| Auth | Zustand session (access token in memory) + HTTP-only refresh cookie |

### State management

- **TanStack Query** — server state (ready for feature hooks)
- **Zustand** — auth session (memory) + UI chrome (`sidebarCollapsed`, persisted)
- **React Hook Form + Zod** — form state / validation

### API layer

- Types generated via `openapi-typescript` from `apps/api/openapi/openapi.v1.json`
- All HTTP goes through `shared/api/client.ts` (`withCredentials`, Bearer attach, single refresh retry)
- Auth endpoints: `/api/v1/auth/login|refresh|logout` only

### Authentication approach

- Login returns access token + user; refresh token remains HTTP-only cookie (ADR-008)
- Client `ProtectedRoute` (static export cannot use Next middleware)
- Permissions derived client-side from role via mirrored `rbac.ts` (UI gating only; API still enforces)

### Component organization

Business screens stay out of `shared/`. Future modules follow `features/<module>/{api,hooks,components,types}`.

---

## 4. Validation

| Check | Status |
|-------|--------|
| `pnpm typecheck` | **PASS** |
| `pnpm lint` | **PASS** |
| `pnpm build` (static export → `out/`) | **PASS** |

Notes:

- Build script forces `NODE_ENV=production` because a parent-shell `NODE_ENV=development` triggers a known Next 15.5 static-export `/500` prerender failure.
- Dev server port: **3001** (API remains **3000**).

---

## 5. Documentation Conflict

| Document | Conflict | Action taken |
|----------|----------|--------------|
| **ADR-007** (React SPA) | F1-01 uses Next.js 15 App Router with static export | **No ADR change** — recorded here |
| **docs/10** (SPA `App.tsx` / `router.tsx`) | Actual routes use App Router under `src/app/` | **No docs change** |

**Recommendation:** Follow-up documentation task to amend ADR-007 (and docs/10, onboarding) to: *Next.js 15 App Router, client-first, `output: 'export'`, no SSR/Server Actions/Route Handlers; NestJS sole backend.*

No additional documentation conflicts were discovered during implementation.

---

## 6. Engineering Review Verdict

| Criterion | Verdict |
|-----------|---------|
| Scalable | **Yes** — feature-first modules + shared kit |
| Maintainable | **Yes** — strict TS, lint/prettier, path aliases, OpenAPI codegen |
| Consistent with backend | **Yes** — frozen OpenAPI + RBAC mirror; no invented APIs |
| Ready for feature development | **Yes** — proceed to F1-02 after approval |

**Verdict: APPROVE (foundation)** — ready for feature work after product/engineering sign-off.

Known limitations (acceptable for F1-01):

- RBAC matrix is duplicated client-side until a shared package exists
- Login UX is minimal (full session polish = F1-02)
- Nav items for business modules are permission-aware placeholders (`comingSoon`)
- No frontend unit/e2e suite yet

---

## 7. Suggestions / Next Steps

1. **F1-02 — Authentication & Session Management** — polished login, expiry UX, password change surface per OpenAPI, session edge cases
2. **F1-03 — Application Shell** — complete nav IA per docs/17, icons, active states, settings entry
3. **F1-04 — Dashboard** — first business screen against frozen dashboard APIs
4. **Docs sync** — amend ADR-007 / docs/10 to match approved Next static-export decision
5. Optional: root `pnpm-workspace.yaml` to include `apps/web` alongside `apps/api`

---

## 8. Technology Decisions

| Library | Why |
|---------|-----|
| Next.js 15 App Router + `output: 'export'` | Approved F1-01 decision; static deploy; SPA-like; no Nest duplication |
| React 19 + TypeScript strict | Stack standard; `noUncheckedIndexedAccess` |
| Tailwind + shadcn/ui patterns | docs/17 tokens; fast, consistent primitives |
| TanStack Query | Server-state cache for Phase 1 modules (ADR pattern) |
| Axios | Single client, interceptors for Bearer + refresh |
| RHF + Zod | Aligns with backend Zod contracts |
| Zustand | Narrow UI/session store only |
| TanStack Table / Recharts | Ready for list/dashboard features; unused for business data in F1-01 |
| pnpm | Matches API / ADR-009 intent |

---

## 9. Self-Review (implementation checklist adapted)

| Area | Result |
|------|--------|
| EP1 Traceability | N/A (foundation) |
| Architecture Compliance | PASS (client-first static export as approved) |
| API Contract | PASS (OpenAPI-only auth wiring; no invented endpoints) |
| ADR Compliance | PARTIAL — ADR-007 text unchanged; runtime follows approved override |
| Layer Responsibilities | PASS |
| Tests | N/A for F1-01 foundation (tooling gates only) |
| General Quality | PASS (`validate` green) |
