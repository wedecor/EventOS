import { describe, expect, it } from 'vitest';
import { permissionsForRole, roleHasPermission } from '@/shared/auth/rbac';

describe('permission rendering helpers', () => {
  it('owner has dashboards:read and settings:write', () => {
    expect(roleHasPermission('owner', 'dashboards:read')).toBe(true);
    expect(roleHasPermission('owner', 'settings:write')).toBe(true);
  });

  it('owner and granted roles have analytics:read', () => {
    expect(roleHasPermission('owner', 'analytics:read')).toBe(true);
    expect(roleHasPermission('sales_manager', 'analytics:read')).toBe(true);
    expect(roleHasPermission('operations_manager', 'analytics:read')).toBe(true);
    expect(roleHasPermission('coordinator', 'analytics:read')).toBe(true);
    expect(roleHasPermission('finance', 'analytics:read')).toBe(true);
    expect(roleHasPermission('viewer', 'analytics:read')).toBe(true);
  });

  it('sales and marketing do not have analytics:read', () => {
    expect(roleHasPermission('sales', 'analytics:read')).toBe(false);
    expect(roleHasPermission('marketing', 'analytics:read')).toBe(false);
  });

  it('sales does not have dashboards:read', () => {
    expect(roleHasPermission('sales', 'dashboards:read')).toBe(false);
    expect(permissionsForRole('sales')).toContain('leads:read');
  });

  it('marketing has no Phase 1 API permissions', () => {
    expect(permissionsForRole('marketing')).toEqual([]);
  });
});
