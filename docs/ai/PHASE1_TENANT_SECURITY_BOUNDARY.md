# Phase-1 Tenant Security Boundary

| Field | Value |
|-------|-------|
| **Status** | Current production model (We Decor single business) |
| **ADR** | ADR-016 |
| **Milestone note** | M4-AI remediation — document + test only; no multi-tenant auth change |

## Actual boundary

```
Internet → JWT (identity + RBAC permissions; tenantId claim present but unused for scoping)
        → PermissionsGuard
        → @TenantId() returns PHASE1_TENANT_ID (hardcoded)
        → Repositories query WHERE tenant_id = PHASE1_TENANT_ID
```

- Canonical id: `00000000-0000-0000-0000-000000000001` (`apps/api/src/shared/tenant/phase1-tenant.ts`)
- Decorator: `apps/api/src/shared/presentation/tenant-context.decorator.ts` — **ignores** `ExecutionContext` / JWT / request body
- User-controlled values (path/query/body `tenantId`) **cannot** override repository scope unless a service incorrectly passes them instead of `@TenantId()`

## What does **not** exist today

- JWT tenant isolation
- Per-request tenant switching
- Cross-tenant denial tests for a second live tenant

## Guidance for future AI services

1. Inject tenant exclusively via `@TenantId()` (or `PHASE1_TENANT_ID` in workers).
2. Never accept client-supplied tenant ids as authoritative.
3. When multi-tenant SaaS lands, replace `@TenantId()` to read `AuthenticatedUser.tenantId` and add cross-tenant integration tests — that is a separate program (historically audit **M7** / track **M4-CH** does not include this).
