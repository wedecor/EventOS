import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../application/services/permission.service';
import type { AuthenticatedUser } from '../../domain/authenticated-user';
import type { Permission, Role } from '../../domain/rbac';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  Permissions,
  PERMISSIONS_KEY,
} from '../decorators/permissions.decorator';
import { Roles, ROLES_KEY } from '../decorators/roles.decorator';
import { PermissionsGuard } from './permissions.guard';

type Metadata = {
  isPublic?: boolean;
  permissions?: Permission[];
  roles?: Role[];
};

function executionContext(
  user: AuthenticatedUser | undefined,
  _metadata: Metadata,
): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: () => ({}),
      getNext: () => undefined,
    }),
  } as unknown as ExecutionContext;
}

function reflectorFor(metadata: Metadata): Reflector {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === IS_PUBLIC_KEY) return metadata.isPublic;
      if (key === PERMISSIONS_KEY) return metadata.permissions;
      if (key === ROLES_KEY) return metadata.roles;
      return undefined;
    }),
  } as unknown as Reflector;
}

function user(role: string): AuthenticatedUser {
  return {
    userId: 'user-1',
    tenantId: '00000000-0000-0000-0000-000000000001',
    email: 'user@wedecor.test',
    role,
  };
}

function buildGuard(metadata: Metadata): PermissionsGuard {
  return new PermissionsGuard(reflectorFor(metadata), new PermissionService());
}

describe('PermissionsGuard', () => {
  it('allows @Public() routes without inspecting the user', () => {
    const guard = buildGuard({ isPublic: true });
    expect(guard.canActivate(executionContext(undefined, {}))).toBe(true);
  });

  it('allows authenticated routes that declare no permission or role', () => {
    const guard = buildGuard({});
    expect(guard.canActivate(executionContext(user('viewer'), {}))).toBe(true);
  });

  it('allows a user whose role holds the required permission', () => {
    const metadata: Metadata = { permissions: ['quotations:approve'] };
    const guard = buildGuard(metadata);
    expect(
      guard.canActivate(executionContext(user('sales_manager'), metadata)),
    ).toBe(true);
  });

  it('grants admin access to any permission-gated route', () => {
    const metadata: Metadata = { permissions: ['settings:write'] };
    const guard = buildGuard(metadata);
    expect(guard.canActivate(executionContext(user('admin'), metadata))).toBe(
      true,
    );
  });

  it('rejects with 403 when the role lacks the required permission', () => {
    const metadata: Metadata = { permissions: ['quotations:approve'] };
    const guard = buildGuard(metadata);
    expect(() =>
      guard.canActivate(executionContext(user('sales'), metadata)),
    ).toThrow(ForbiddenException);
  });

  it('rejects with 403 when the role is missing a required permission entirely', () => {
    const metadata: Metadata = { permissions: ['payments:record'] };
    const guard = buildGuard(metadata);
    expect(() =>
      guard.canActivate(executionContext(user('viewer'), metadata)),
    ).toThrow(ForbiddenException);
  });

  it('enforces @Roles() lists (role-specific endpoint access)', () => {
    const metadata: Metadata = { roles: ['owner', 'admin'] };
    const allow = buildGuard(metadata);
    expect(allow.canActivate(executionContext(user('owner'), metadata))).toBe(
      true,
    );

    const deny = buildGuard(metadata);
    expect(() =>
      deny.canActivate(executionContext(user('sales'), metadata)),
    ).toThrow(ForbiddenException);
  });

  it('requires BOTH role and permission when both are declared', () => {
    // sales_manager holds quotations:approve but is not in the role list → denied.
    const metadata: Metadata = {
      permissions: ['quotations:approve'],
      roles: ['owner', 'admin'],
    };
    const guard = buildGuard(metadata);
    expect(() =>
      guard.canActivate(executionContext(user('sales_manager'), metadata)),
    ).toThrow(ForbiddenException);
  });

  it('rejects a protected route reached without an authenticated identity', () => {
    const metadata: Metadata = { permissions: ['leads:read'] };
    const guard = buildGuard(metadata);
    expect(() =>
      guard.canActivate(executionContext(undefined, metadata)),
    ).toThrow(ForbiddenException);
  });

  it('rejects an unrecognised role for a permission-gated route', () => {
    const metadata: Metadata = { permissions: ['leads:read'] };
    const guard = buildGuard(metadata);
    expect(() =>
      guard.canActivate(executionContext(user('intern'), metadata)),
    ).toThrow(ForbiddenException);
  });
});

describe('authorization decorators', () => {
  const reflector = new Reflector();

  it('@Permissions attaches the permission list as route metadata', () => {
    class SampleController {
      @Permissions('leads:read', 'leads:write')
      handler(): void {}
    }

    const metadata = reflector.get<Permission[]>(
      PERMISSIONS_KEY,
      SampleController.prototype.handler,
    );
    expect(metadata).toEqual(['leads:read', 'leads:write']);
  });

  it('@Roles attaches the role list as route metadata', () => {
    class SampleController {
      @Roles('owner', 'admin')
      handler(): void {}
    }

    const metadata = reflector.get<Role[]>(
      ROLES_KEY,
      SampleController.prototype.handler,
    );
    expect(metadata).toEqual(['owner', 'admin']);
  });

  it('@Permissions applies at the controller (class) level', () => {
    @Permissions('dashboards:read')
    class SampleController {}

    const metadata = reflector.get<Permission[]>(
      PERMISSIONS_KEY,
      SampleController,
    );
    expect(metadata).toEqual(['dashboards:read']);
  });
});
