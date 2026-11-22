'use client';

import { AppShell } from '@/shared/components/layout/app-shell';
import { ProtectedRoute } from '@/shared/components/layout/protected-route';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}
