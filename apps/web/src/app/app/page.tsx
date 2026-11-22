'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { resolveDefaultAppHref, useAuth } from '@/features/auth';
import { PageLoader } from '@/shared/components/feedback/page-loader';

/** Default authenticated landing → first permission-allowed module. */
export default function AppIndexPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();

  useEffect(() => {
    router.replace(resolveDefaultAppHref(hasPermission));
  }, [router, hasPermission]);

  return <PageLoader label="Opening Event OS…" />;
}
