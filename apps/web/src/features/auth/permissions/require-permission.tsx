'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { Permission } from '@/shared/auth/rbac';
import { PageLoader } from '@/shared/components/feedback/page-loader';
import { useAuthStore } from '../hooks/use-auth-store';
import { usePermissions } from './permission-context';

type RequirePermissionProps = {
  permission?: Permission;
  anyOf?: readonly Permission[];
  everyOf?: readonly Permission[];
  children: ReactNode;
};

/**
 * Route-level permission guard. Redirects to /forbidden when lacking access.
 * Must be nested inside ProtectedRoute (authenticated).
 */
export function RequirePermission({
  permission,
  anyOf,
  everyOf,
  children,
}: RequirePermissionProps) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const { hasPermission, hasEveryPermission, hasSomePermission } = usePermissions();

  let allowed = true;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (everyOf && everyOf.length > 0) {
    allowed = hasEveryPermission(everyOf);
  } else if (anyOf && anyOf.length > 0) {
    allowed = hasSomePermission(anyOf);
  }

  useEffect(() => {
    if (status === 'authenticated' && !allowed) {
      router.replace('/forbidden/');
    }
  }, [status, allowed, router]);

  if (status === 'unknown') {
    return <PageLoader label="Checking permissions…" />;
  }

  if (!allowed) {
    return <PageLoader label="Redirecting…" />;
  }

  return children;
}
