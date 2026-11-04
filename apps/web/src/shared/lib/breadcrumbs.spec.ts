import { describe, expect, it } from 'vitest';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import {
  filterNavByPermissions,
  flattenNavLinks,
  isNavActive,
  isNavItemAllowed,
} from '@/features/auth/lib/filter-nav';
import { MAIN_NAV } from '@/shared/config/navigation';
import { roleHasPermission } from '@/shared/auth/rbac';

describe('buildBreadcrumbs', () => {
  it('builds nested breadcrumbs for settings routes', () => {
    const items = buildBreadcrumbs('/app/settings/team/');
    expect(items.map((i) => i.label)).toEqual(['Home', 'Settings', 'Team']);
    expect(items[0]?.href).toBe('/app/');
    expect(items[2]?.href).toBeUndefined();
  });

  it('supports custom current title and dynamic segments', () => {
    const id = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
    const items = buildBreadcrumbs(`/app/customers/${id}/`, {
      currentTitle: 'Acme Corp',
    });
    expect(items.at(-1)?.label).toBe('Acme Corp');
  });
});

describe('navigation permissions & active state', () => {
  it('filters nested operations for sales (no staff/vendors/inventory/reports)', () => {
    const items = filterNavByPermissions(MAIN_NAV, (p) => roleHasPermission('sales', p));
    const ids = flattenNavLinks(items).map((i) => i.id);
    expect(ids).toContain('leads');
    expect(ids).toContain('customers');
    expect(ids).not.toContain('reports');
    expect(ids).not.toContain('dashboard');
    expect(ids).not.toContain('staff');
    expect(items.find((i) => i.id === 'operations')).toBeUndefined();
  });

  it('shows reports for roles with dashboards:read', () => {
    const viewerItems = filterNavByPermissions(MAIN_NAV, (p) =>
      roleHasPermission('viewer', p),
    );
    expect(flattenNavLinks(viewerItems).map((i) => i.id)).toContain('reports');
  });

  it('shows security to sales without settings:read', () => {
    const items = filterNavByPermissions(MAIN_NAV, (p) =>
      roleHasPermission('sales', p),
    );
    const ids = flattenNavLinks(items).map((i) => i.id);
    expect(ids).toContain('security');
    expect(ids).not.toContain('settings-general');
  });

  it('keeps operations children for operations_manager', () => {
    const items = filterNavByPermissions(MAIN_NAV, (p) =>
      roleHasPermission('operations_manager', p),
    );
    const ops = items.find((i) => i.id === 'operations');
    expect(ops?.children?.map((c) => c.id)).toEqual(
      expect.arrayContaining(['staff', 'vendors', 'inventory']),
    );
  });

  it('anyOf visibility for finance', () => {
    const finance = MAIN_NAV.find((i) => i.id === 'finance')!;
    expect(isNavItemAllowed(finance, (p) => roleHasPermission('finance', p))).toBe(true);
    expect(isNavItemAllowed(finance, (p) => roleHasPermission('sales', p))).toBe(false);
  });

  it('highlights dashboard without matching every /app route', () => {
    expect(isNavActive('/app/dashboard/', '/app/dashboard/')).toBe(true);
    expect(isNavActive('/app/leads/', '/app/dashboard/')).toBe(false);
    expect(isNavActive('/app/leads/abc/', '/app/leads/')).toBe(true);
  });
});
