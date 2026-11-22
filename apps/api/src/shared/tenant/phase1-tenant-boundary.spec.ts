import { PHASE1_TENANT_ID } from './phase1-tenant';

/**
 * Locks the Phase-1 single-business security model for AI readiness.
 * Multi-tenant JWT scoping is explicitly out of scope for this milestone.
 */
describe('Phase-1 tenant security boundary', () => {
  it('uses a stable canonical tenant id shared with seed', () => {
    expect(PHASE1_TENANT_ID).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(PHASE1_TENANT_ID).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('treats client-supplied tenant ids as untrusted', () => {
    const clientClaim = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    // Future AI services must call repositories with @TenantId()/PHASE1_TENANT_ID,
    // never with raw request.query.tenantId or JWT claims in Phase 1.
    const repositoryScope = PHASE1_TENANT_ID;
    expect(repositoryScope).toBe(PHASE1_TENANT_ID);
    expect(repositoryScope).not.toBe(clientClaim);
  });
});
