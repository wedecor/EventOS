/**
 * M5-01 — configuration of the one-off production seed (Cloud Run Job
 * `eventos-seed-prod`). It creates exactly one tenant and one owner user: no demo
 * leads, quotations, bookings or inventory (docs/16; ADR-016 single tenant).
 */
import { PHASE1_TENANT_ID } from '../tenant/phase1-tenant';

export const DEFAULT_PROD_TENANT_NAME = 'We Decor Events';
export const DEFAULT_PROD_TENANT_SLUG = 'we-decor';

export type ProdSeedConfig = {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  ownerEmail: string;
  ownerName: string;
  /** Optional: the owner normally signs in through the Firebase bridge. */
  ownerPassword: string | undefined;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveProdSeedConfig(
  env: Record<string, string | undefined>,
): ProdSeedConfig {
  const ownerEmail = env.SEED_OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail || !EMAIL_PATTERN.test(ownerEmail)) {
    throw new Error(
      'SEED_OWNER_EMAIL is required and must be a valid email address.',
    );
  }

  const ownerPassword = env.SEED_OWNER_PASSWORD?.trim() || undefined;
  if (ownerPassword !== undefined && ownerPassword.length < 12) {
    throw new Error('SEED_OWNER_PASSWORD must be at least 12 characters.');
  }

  const tenantSlug = (
    env.SEED_TENANT_SLUG?.trim() || DEFAULT_PROD_TENANT_SLUG
  ).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantSlug)) {
    throw new Error('SEED_TENANT_SLUG must be a lowercase kebab-case slug.');
  }

  return {
    tenantId: PHASE1_TENANT_ID,
    tenantName: env.SEED_TENANT_NAME?.trim() || DEFAULT_PROD_TENANT_NAME,
    tenantSlug,
    ownerEmail,
    ownerName: env.SEED_OWNER_NAME?.trim() || 'Owner',
    ownerPassword,
  };
}
