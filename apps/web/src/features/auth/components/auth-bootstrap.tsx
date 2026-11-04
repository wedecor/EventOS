'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  bindAuthTokenGetter,
  bindRefreshHandler,
  bindUnauthorizedHandler,
} from '@/shared/api/client';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../hooks/use-auth-store';
import { computeSilentRefreshDelayMs } from '../lib/session-timing';

/**
 * Session bootstrap + silent refresh + API client auth bindings.
 * Static export: all session logic is client-side (no Next middleware).
 */
export function AuthBootstrap({ children }: { children: ReactNode }) {
  const bootstrapped = useRef(false);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshing = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const status = useAuthStore((s) => s.status);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setAnonymous = useAuthStore((s) => s.setAnonymous);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const performSilentRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshing.current) {
      return useAuthStore.getState().accessToken;
    }
    refreshing.current = true;
    try {
      const session = await authApi.refresh();
      setSession(session);
      return session.accessToken;
    } catch {
      clearSession('expired');
      return null;
    } finally {
      refreshing.current = false;
    }
  }, [clearSession, setSession]);

  useEffect(() => {
    bindAuthTokenGetter(() => useAuthStore.getState().accessToken);
    bindUnauthorizedHandler(() => {
      clearSession('unauthorized');
    });
    bindRefreshHandler(performSilentRefresh);
  }, [clearSession, performSilentRefresh]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    void (async () => {
      try {
        const session = await authApi.refresh();
        setSession(session);
      } catch {
        setAnonymous();
      }
    })();
  }, [setAnonymous, setSession]);

  // Proactive silent refresh before access-token expiry.
  useEffect(() => {
    clearRefreshTimer();
    if (status !== 'authenticated' || !expiresAt) {
      return;
    }

    const delay = computeSilentRefreshDelayMs(expiresAt);
    refreshTimer.current = setTimeout(() => {
      void performSilentRefresh();
    }, delay);

    return clearRefreshTimer;
  }, [status, expiresAt, performSilentRefresh, clearRefreshTimer]);

  // Redirect when session ends while on a protected route.
  useEffect(() => {
    if (status !== 'anonymous') return;
    const reason = useAuthStore.getState().sessionEndReason;
    const onProtected = pathname?.startsWith('/app');
    if (!onProtected) return;

    if (reason === 'expired' || reason === 'unauthorized') {
      router.replace('/unauthorized/');
    } else {
      router.replace('/login/');
    }
  }, [status, pathname, router]);

  return children;
}
