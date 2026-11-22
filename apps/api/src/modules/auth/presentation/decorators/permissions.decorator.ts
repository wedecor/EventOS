import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../../domain/rbac';

export const PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declares the permission(s) required to invoke a route (or every route on a
 * controller). Enforced by the globally-registered {@link PermissionsGuard}: the
 * authenticated user's role must hold ALL listed permissions or the request is
 * rejected with 403 (docs/10 §Errors: "Permission failures → 403 FORBIDDEN").
 *
 * Permission keys map to the documented per-endpoint contracts in docs/09-api-design.md.
 */
export const Permissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator =>
  SetMetadata(PERMISSIONS_KEY, permissions);
