import { describe, expect, it } from 'vitest';
import { roleHasPermission } from '@/shared/auth/rbac';
import {
  AUTHENTICATED_FALLBACK_HREF,
  resolveDefaultAppHref,
} from './default-app-href';

describe('resolveDefaultAppHref', () => {
  it('sends owner/admin to dashboard', () => {
    expect(
      resolveDefaultAppHref((p) => roleHasPermission('owner', p)),
    ).toBe('/app/dashboard/');
  });

  it('does not send sales to dashboard (no dashboards:read)', () => {
    const href = resolveDefaultAppHref((p) => roleHasPermission('sales', p));
    expect(href).not.toBe('/app/dashboard/');
    expect(href).toBe('/app/customers/');
  });

  it('falls back when nothing is allowed', () => {
    expect(resolveDefaultAppHref(() => false)).toBe(AUTHENTICATED_FALLBACK_HREF);
  });
});
