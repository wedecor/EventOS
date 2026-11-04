import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';

describe('useAuthStore session lifecycle', () => {
  beforeEach(() => {
    useAuthStore.setState({
      status: 'unknown',
      accessToken: null,
      expiresAt: null,
      user: null,
      sessionEndReason: null,
    });
  });

  it('restores session on setSession (login / refresh success)', () => {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      expiresIn: 900,
      user: { id: '1', email: 'a@b.co', name: 'A', role: 'admin' },
    });

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.accessToken).toBe('token');
    expect(state.user?.role).toBe('admin');
    expect(state.expiresAt).toBeGreaterThan(Date.now());
    expect(state.sessionEndReason).toBeNull();
  });

  it('clears session on logout', () => {
    useAuthStore.getState().setSession({
      accessToken: 'token',
      expiresIn: 900,
      user: { id: '1', email: 'a@b.co', name: 'A', role: 'admin' },
    });
    useAuthStore.getState().clearSession('logout');

    const state = useAuthStore.getState();
    expect(state.status).toBe('anonymous');
    expect(state.accessToken).toBeNull();
    expect(state.sessionEndReason).toBe('logout');
  });

  it('records expiry / unauthorized end reasons', () => {
    useAuthStore.getState().clearSession('expired');
    expect(useAuthStore.getState().sessionEndReason).toBe('expired');
    useAuthStore.getState().clearSession('unauthorized');
    expect(useAuthStore.getState().sessionEndReason).toBe('unauthorized');
  });

  it('marks anonymous after failed session restore', () => {
    useAuthStore.getState().setAnonymous();
    expect(useAuthStore.getState().status).toBe('anonymous');
    expect(useAuthStore.getState().sessionEndReason).toBeNull();
  });
});

describe('session timing', () => {
  it('computes silent refresh delay with skew', async () => {
    const { computeSilentRefreshDelayMs, isAccessTokenExpired } = await import(
      '@/features/auth/lib/session-timing'
    );
    const now = 1_000_000;
    expect(computeSilentRefreshDelayMs(now + 120_000, now, 60_000)).toBe(60_000);
    expect(computeSilentRefreshDelayMs(now + 30_000, now, 60_000)).toBe(0);
    expect(isAccessTokenExpired(now - 1, now)).toBe(true);
    expect(isAccessTokenExpired(now + 1, now)).toBe(false);
  });
});

describe('permission-aware navigation', () => {
  it('filters nav items by permissions', async () => {
    const { filterNavByPermissions, flattenNavLinks } = await import(
      '@/features/auth/lib/filter-nav'
    );
    const { MAIN_NAV } = await import('@/shared/config/navigation');
    const { roleHasPermission } = await import('@/shared/auth/rbac');

    const salesItems = filterNavByPermissions(MAIN_NAV, (p) =>
      roleHasPermission('sales', p),
    );
    const labels = flattenNavLinks(salesItems).map((i) => i.id);
    expect(labels).toContain('leads');
    expect(labels).toContain('customers');
    expect(labels).not.toContain('dashboard');
  });
});
