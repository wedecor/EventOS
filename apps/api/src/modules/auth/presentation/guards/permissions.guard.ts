import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PermissionService } from '../../application/services/permission.service';
import type { AuthenticatedUser } from '../../domain/authenticated-user';
import type { Permission, Role } from '../../domain/rbac';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Phase 1 authorization enforcement (docs/14 §Authorization, docs/09 per-endpoint
 * contracts). Registered globally (APP_GUARD) directly AFTER {@link JwtAuthGuard},
 * so it only runs once an authenticated identity is attached to the request.
 *
 * Behaviour:
 * - `@Public()` routes bypass authorization entirely.
 * - Routes with neither `@Permissions()` nor `@Roles()` require authentication only
 *   (JwtAuthGuard already enforced it) — no additional role gating.
 * - Otherwise the caller's role must hold ALL `@Permissions()` AND be within any
 *   `@Roles()` list; failure raises 403 FORBIDDEN (docs/10 §Errors).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const requiredRoles =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredPermissions.length === 0 && requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user) {
      // Defensive: a protected route reached this guard without an identity.
      throw new ForbiddenException('Authentication is required.');
    }

    if (
      requiredRoles.length > 0 &&
      !this.permissionService.hasAnyRole(user.role, requiredRoles)
    ) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    if (
      requiredPermissions.length > 0 &&
      !this.permissionService.hasAllPermissions(user.role, requiredPermissions)
    ) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    return true;
  }
}
