'use client';

import { useCallback, useMemo } from 'react';
import { authApi } from '../api/auth.api';
import { useAuthStore } from './use-auth-store';
import type { LoginRequestBody } from '../schemas/auth.schemas';
import {
  permissionsForRole,
  roleHasPermission,
  type Permission,
} from '@/shared/auth/rbac';

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const sessionEndReason = useAuthStore((s) => s.sessionEndReason);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const permissions = useMemo(
    () => (user ? [...permissionsForRole(user.role)] : []),
    [user],
  );

  const login = useCallback(
    async (credentials: LoginRequestBody) => {
      const session = await authApi.login(credentials);
      setSession(session);
      return session;
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession('logout');
    }
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return roleHasPermission(user.role, permission);
    },
    [user],
  );

  const hasEveryPermission = useCallback(
    (required: readonly Permission[]) => required.every((p) => hasPermission(p)),
    [hasPermission],
  );

  const hasSomePermission = useCallback(
    (required: readonly Permission[]) => required.some((p) => hasPermission(p)),
    [hasPermission],
  );

  return {
    status,
    user,
    accessToken,
    expiresAt,
    sessionEndReason,
    permissions,
    isAuthenticated: status === 'authenticated',
    isRestoring: status === 'unknown',
    login,
    logout,
    hasPermission,
    hasEveryPermission,
    hasSomePermission,
  };
}
