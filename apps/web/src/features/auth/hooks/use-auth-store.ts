import { create } from 'zustand';
import type { AuthSessionPayload, AuthUser } from '../schemas/auth.schemas';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

/** Why the session became anonymous — drives unauthorized UX. */
export type SessionEndReason = 'logout' | 'expired' | 'unauthorized' | null;

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  expiresAt: number | null;
  user: AuthUser | null;
  sessionEndReason: SessionEndReason;
  setSession: (payload: AuthSessionPayload) => void;
  clearSession: (reason?: Exclude<SessionEndReason, null>) => void;
  setAnonymous: () => void;
};

/**
 * In-memory auth session (access token). Refresh token stays HTTP-only (ADR-008).
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  accessToken: null,
  expiresAt: null,
  user: null,
  sessionEndReason: null,
  setSession: ({ accessToken, expiresIn, user }) =>
    set({
      status: 'authenticated',
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
      user,
      sessionEndReason: null,
    }),
  clearSession: (reason = 'logout') =>
    set({
      status: 'anonymous',
      accessToken: null,
      expiresAt: null,
      user: null,
      sessionEndReason: reason,
    }),
  setAnonymous: () =>
    set({
      status: 'anonymous',
      accessToken: null,
      expiresAt: null,
      user: null,
      sessionEndReason: null,
    }),
}));
