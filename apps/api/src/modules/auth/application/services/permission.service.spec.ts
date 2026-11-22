import { PERMISSIONS, PHASE1_ROLES, ROLE_PERMISSIONS } from '../../domain/rbac';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    service = new PermissionService();
  });

  describe('getPermissionsForRole', () => {
    it('grants owner and admin every documented permission', () => {
      expect(service.getPermissionsForRole('owner')).toEqual(PERMISSIONS);
      expect(service.getPermissionsForRole('admin')).toEqual(PERMISSIONS);
    });

    it('returns the documented subset for a scoped role', () => {
      const sales = service.getPermissionsForRole('sales');
      expect(sales).toContain('leads:write');
      expect(sales).toContain('quotations:write');
      // sales cannot approve quotations (docs/09 §Quotation approve)
      expect(sales).not.toContain('quotations:approve');
      // sales has no finance permissions
      expect(sales).not.toContain('payments:record');
    });

    it('returns an empty set for an unknown role (deny by default)', () => {
      expect(service.getPermissionsForRole('super_admin')).toEqual([]);
      expect(service.getPermissionsForRole('')).toEqual([]);
    });

    it('grants marketing no Phase 1 API permissions', () => {
      expect(service.getPermissionsForRole('marketing')).toEqual([]);
    });

    it('restricts viewer to read-only permissions', () => {
      const viewer = service.getPermissionsForRole('viewer');
      expect(
        viewer.every((permission) => /:read$|read$/.test(permission)),
      ).toBe(true);
      expect(viewer).toContain('dashboards:read');
      expect(viewer).not.toContain('leads:write');
    });
  });

  describe('hasPermission', () => {
    it('is true when the role holds the permission', () => {
      expect(service.hasPermission('finance', 'payments:record')).toBe(true);
      expect(service.hasPermission('operations_manager', 'staff:write')).toBe(
        true,
      );
    });

    it('is false when the role lacks the permission', () => {
      expect(service.hasPermission('viewer', 'leads:write')).toBe(false);
      expect(service.hasPermission('sales', 'quotations:approve')).toBe(false);
    });

    it('is false for an unknown role', () => {
      expect(service.hasPermission('nobody', 'leads:read')).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('requires every listed permission (AND semantics)', () => {
      expect(
        service.hasAllPermissions('finance', [
          'invoices:write',
          'invoices:send',
        ]),
      ).toBe(true);
      expect(
        service.hasAllPermissions('finance', ['invoices:write', 'leads:write']),
      ).toBe(false);
    });

    it('is vacuously true for an empty permission list', () => {
      expect(service.hasAllPermissions('viewer', [])).toBe(true);
    });
  });

  describe('hasAnyRole', () => {
    it('is true when the role is in the allowed list', () => {
      expect(
        service.hasAnyRole('operations_manager', [
          'operations_manager',
          'owner',
          'admin',
        ]),
      ).toBe(true);
    });

    it('is false when the role is not in the allowed list', () => {
      expect(service.hasAnyRole('sales', ['operations_manager', 'owner'])).toBe(
        false,
      );
    });

    it('is false for an unrecognised role', () => {
      expect(service.hasAnyRole('ghost', ['owner', 'admin'])).toBe(false);
    });
  });

  it('defines a permission set for every Phase 1 role', () => {
    for (const role of PHASE1_ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
