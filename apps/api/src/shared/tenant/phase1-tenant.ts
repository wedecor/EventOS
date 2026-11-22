/**
 * ADR-016 (Phase 1 Single-Tenant Mode): the canonical, fixed tenant id for the
 * single seeded "We Decor" tenant. This is the single source of truth shared by
 * the `@TenantId()` request decorator and the Prisma seed so the two can never
 * drift apart. All tenant-scoped queries in Phase 1 resolve to this id.
 */
export const PHASE1_TENANT_ID = '00000000-0000-0000-0000-000000000001';
