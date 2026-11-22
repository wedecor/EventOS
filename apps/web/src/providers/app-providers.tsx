'use client';

import { AuthBootstrap } from '@/features/auth';
import { PermissionProvider } from '@/features/auth/permissions/permission-context';
import { AppToaster } from '@/shared/components/feedback/toaster';
import { AppErrorBoundary } from './error-boundary';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <QueryProvider>
          <AuthBootstrap>
            <PermissionProvider>
              {children}
              <AppToaster />
            </PermissionProvider>
          </AuthBootstrap>
        </QueryProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
