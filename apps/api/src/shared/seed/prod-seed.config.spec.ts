import { PHASE1_TENANT_ID } from '../tenant/phase1-tenant';
import {
  DEFAULT_PROD_TENANT_NAME,
  DEFAULT_PROD_TENANT_SLUG,
  resolveProdSeedConfig,
} from './prod-seed.config';

describe('resolveProdSeedConfig (M5-01)', () => {
  it('seeds the single Phase 1 tenant with the documented defaults', () => {
    const config = resolveProdSeedConfig({
      SEED_OWNER_EMAIL: 'Owner@Example.com ',
    });

    expect(config).toEqual({
      tenantId: PHASE1_TENANT_ID,
      tenantName: DEFAULT_PROD_TENANT_NAME,
      tenantSlug: DEFAULT_PROD_TENANT_SLUG,
      ownerEmail: 'owner@example.com',
      ownerName: 'Owner',
      ownerPassword: undefined,
    });
    expect(DEFAULT_PROD_TENANT_NAME).toBe('We Decor Events');
  });

  it('accepts overrides for tenant, owner name and a password', () => {
    const config = resolveProdSeedConfig({
      SEED_OWNER_EMAIL: 'boss@example.com',
      SEED_OWNER_NAME: 'The Boss',
      SEED_OWNER_PASSWORD: 'a-very-long-password',
      SEED_TENANT_NAME: 'Acme Events',
      SEED_TENANT_SLUG: 'acme-events',
    });

    expect(config).toMatchObject({
      ownerName: 'The Boss',
      ownerPassword: 'a-very-long-password',
      tenantName: 'Acme Events',
      tenantSlug: 'acme-events',
    });
  });

  it('requires a valid owner email (no hardcoded owner)', () => {
    expect(() => resolveProdSeedConfig({})).toThrow(/SEED_OWNER_EMAIL/);
    expect(() =>
      resolveProdSeedConfig({ SEED_OWNER_EMAIL: 'not-an-email' }),
    ).toThrow(/SEED_OWNER_EMAIL/);
  });

  it('rejects weak passwords and invalid slugs', () => {
    expect(() =>
      resolveProdSeedConfig({
        SEED_OWNER_EMAIL: 'a@b.co',
        SEED_OWNER_PASSWORD: 'short',
      }),
    ).toThrow(/at least 12/);
    expect(() =>
      resolveProdSeedConfig({
        SEED_OWNER_EMAIL: 'a@b.co',
        SEED_TENANT_SLUG: 'Bad Slug!',
      }),
    ).toThrow(/SEED_TENANT_SLUG/);
  });
});
