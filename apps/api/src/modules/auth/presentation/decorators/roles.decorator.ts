import { SetMetadata } from '@nestjs/common';
import type { Role } from '../../domain/rbac';

export const ROLES_KEY = 'requiredRoles';

/**
 * Declares the role(s) allowed to invoke a route (or every route on a controller).
 * Enforced by the globally-registered {@link PermissionsGuard}: the authenticated
 * user's role must be one of the listed roles (ANY) or the request is rejected with
 * 403. Complementary to {@link Permissions}; use when docs/09 specifies a role list
 * that is narrower than the permission's general grant.
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
