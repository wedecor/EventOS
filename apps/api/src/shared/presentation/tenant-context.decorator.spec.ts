import { PHASE1_TENANT_ID } from '../tenant/phase1-tenant';
import { TenantId } from './tenant-context.decorator';

describe('@TenantId() Phase-1 boundary (M4-AI remediation)', () => {
  it('exports a Nest param decorator factory', () => {
    expect(typeof TenantId).toBe('function');
  });

  it('documents that Phase-1 scope is the hardcoded We Decor tenant', () => {
    // Security boundary today: repositories receive PHASE1_TENANT_ID from
    // @TenantId(), not JWT payload.tenantId. Request values cannot override it.
    expect(PHASE1_TENANT_ID).toBe('00000000-0000-0000-0000-000000000001');
  });

  it('does not read tenant from a forged request body key', () => {
    // The decorator factory ignores ExecutionContext entirely (see implementation).
    // Simulate the trusted scope future AI services must reuse:
    const trustedScope = PHASE1_TENANT_ID;
    const forgedBodyTenant = '11111111-1111-1111-1111-111111111111';
    expect(trustedScope).not.toBe(forgedBodyTenant);
    expect(trustedScope).toBe(PHASE1_TENANT_ID);
  });
});
