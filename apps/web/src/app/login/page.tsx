'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/features/auth/components/login-form';
import { resolveDefaultAppHref, useAuth, useAuthStore } from '@/features/auth';
import { PageLoader } from '@/shared/components/feedback/page-loader';

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const { hasPermission } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(resolveDefaultAppHref(hasPermission));
    }
  }, [status, router, hasPermission]);

  if (status === 'unknown') {
    return <PageLoader label="Checking session…" />;
  }

  if (status === 'authenticated') {
    return <PageLoader label="Redirecting…" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <LoginForm />
    </div>
  );
}
