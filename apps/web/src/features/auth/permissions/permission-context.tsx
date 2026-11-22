'use client';

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Permission } from '@/shared/auth/rbac';

type PermissionContextValue = {
  permissions: readonly Permission[];
  role: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasEveryPermission: (required: readonly Permission[]) => boolean;
  hasSomePermission: (required: readonly Permission[]) => boolean;
};

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user, permissions, hasPermission, hasEveryPermission, hasSomePermission } = useAuth();

  const value = useMemo<PermissionContextValue>(
    () => ({
      permissions,
      role: user?.role ?? null,
      hasPermission,
      hasEveryPermission,
      hasSomePermission,
    }),
    [permissions, user?.role, hasPermission, hasEveryPermission, hasSomePermission],
  );

  return (
    <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>
  );
}

export function usePermissions(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return ctx;
}
