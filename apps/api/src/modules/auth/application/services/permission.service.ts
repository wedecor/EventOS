import { Injectable } from '@nestjs/common';
import {
  isRole,
  ROLE_PERMISSIONS,
  type Permission,
  type Role,
} from '../../domain/rbac';

/**
 * Resolves and evaluates a role's permission set (docs/14 §Authorization Security:
 * "Authorization checked in application layer"). The authorization *logic* lives here
 * in the application layer; the {@link PermissionsGuard} is the enforcement point that
 * delegates to this service. Pure and side-effect-free — safe to unit test in isolation.
 */
@Injectable()
export class PermissionService {
  /**
   * The permissions granted to a role. Unknown/unrecognised roles resolve to an
   * empty set (deny-by-default), never throwing.
   */
  getPermissionsForRole(role: string): readonly Permission[] {
    if (!isRole(role)) {
      return [];
    }
    return ROLE_PERMISSIONS[role satisfies Role];
  }

  /** Does the role hold the given permission? */
  hasPermission(role: string, permission: Permission): boolean {
    return this.getPermissionsForRole(role).includes(permission);
  }

  /** Does the role hold every one of the given permissions (AND)? */
  hasAllPermissions(role: string, permissions: readonly Permission[]): boolean {
    const granted = this.getPermissionsForRole(role);
    return permissions.every((permission) => granted.includes(permission));
  }

  /** Is the role one of the allowed roles (ANY)? */
  hasAnyRole(role: string, allowedRoles: readonly Role[]): boolean {
    return isRole(role) && allowedRoles.includes(role);
  }
}
