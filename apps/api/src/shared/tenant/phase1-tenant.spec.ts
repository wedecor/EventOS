import { PHASE1_TENANT_ID } from './phase1-tenant';

describe('PHASE1_TENANT_ID (ADR-016)', () => {
  it('is the canonical We Decor Phase 1 tenant id', () => {
    // Locks the ADR-016 value. The Prisma seed and the @TenantId() decorator both
    // import this constant; if it ever changes, seeded data and request scoping
    // would diverge (the C12 bug), so this value must not drift.
    expect(PHASE1_TENANT_ID).toBe('00000000-0000-0000-0000-000000000001');
  });
});
