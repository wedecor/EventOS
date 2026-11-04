'use client';

import type { ReactNode } from 'react';
import type { Permission } from '@/shared/auth/rbac';
import { usePermissions } from './permission-context';

type CanProps = {
  permission?: Permission;
  anyOf?: readonly Permission[];
  everyOf?: readonly Permission[];
  children: ReactNode;
  fallback?: ReactNode;
};

/**
 * Permission-aware render gate. Uses backend permission keys only.
 */
export function Can({ permission, anyOf, everyOf, children, fallback = null }: CanProps) {
  const { hasPermission, hasEveryPermission, hasSomePermission } = usePermissions();

  let allowed = true;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (everyOf && everyOf.length > 0) {
    allowed = hasEveryPermission(everyOf);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasSomePermission(anyOf);
  }

  return allowed ? children : fallback;
}
