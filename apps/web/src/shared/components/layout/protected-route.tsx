'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import { PageLoader } from '@/shared/components/feedback/page-loader';

type ProtectedRouteProps = {
  children: ReactNode;
  /** Where to send anonymous users (default login). */
  redirectTo?: string;
};

/**
 * Client-side auth guard for `/app/**` (static export — no Next middleware).
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login/',
}: ProtectedRouteProps) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const sessionEndReason = useAuthStore((s) => s.sessionEndReason);

  useEffect(() => {
    if (status !== 'anonymous') return;
    if (sessionEndReason === 'expired' || sessionEndReason === 'unauthorized') {
      router.replace('/unauthorized/');
      return;
    }
    router.replace(redirectTo);
  }, [status, sessionEndReason, router, redirectTo]);

  if (status === 'unknown') {
    return <PageLoader label="Restoring session…" />;
  }

  if (status !== 'authenticated') {
    return <PageLoader label="Redirecting…" />;
  }

  return children;
}
