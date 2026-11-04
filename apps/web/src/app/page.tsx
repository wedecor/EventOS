'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveDefaultAppHref, useAuth, useAuthStore } from '@/features/auth';
import { PageLoader } from '@/shared/components/feedback/page-loader';

/** Entry redirect — authenticated users to first allowed module, others to /login. */
export default function HomePage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(resolveDefaultAppHref(hasPermission));
    } else if (status === 'anonymous') {
      router.replace('/login/');
    }
  }, [status, router, hasPermission]);

  return <PageLoader label="Starting Event OS…" />;
}
