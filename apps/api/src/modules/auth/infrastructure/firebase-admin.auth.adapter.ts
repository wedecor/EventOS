import { Injectable, Logger } from '@nestjs/common';
import type { App } from 'firebase-admin/app';
import {
  FirebaseAuthPort,
  type FirebaseVerifyFailureReason,
  type FirebaseVerifyResult,
} from '../application/ports/firebase-auth.port';

const APP_NAME = 'eventos-firebase-bridge';

// Firebase Auth error codes that mean "the token is bad", by reason.
const EXPIRED_CODES = new Set(['auth/id-token-expired']);
const REVOKED_CODES = new Set(['auth/id-token-revoked']);
const DISABLED_CODES = new Set(['auth/user-disabled']);
const UNAVAILABLE_CODES = new Set([
  'auth/internal-error',
  'auth/network-request-failed',
  'app/network-error',
  'app/network-timeout',
  'app/invalid-credential',
  'auth/insufficient-permission',
  'auth/quota-exceeded',
]);

/**
 * firebase-admin adapter for {@link FirebaseAuthPort}. Uses Application Default
 * Credentials (Cloud Run service account holding `roles/firebaseauth.viewer`);
 * `GOOGLE_APPLICATION_CREDENTIALS` is only for local development.
 *
 * `verifyIdToken(token, true)` checks signature, expiry, audience/issuer for the
 * configured project, revocation, and — via the user lookup it performs — whether
 * the Firebase user is disabled.
 */
@Injectable()
export class FirebaseAdminAuthAdapter extends FirebaseAuthPort {
  private readonly logger = new Logger(FirebaseAdminAuthAdapter.name);
  private app: App | null = null;

  constructor(private readonly projectId: string) {
    super();
  }

  getProjectId(): string {
    return this.projectId;
  }

  async verifyIdToken(idToken: string): Promise<FirebaseVerifyResult> {
    try {
      // firebase-admin is loaded lazily: it pulls ESM-only transitive deps that
      // unit-test runners cannot parse, and it is only needed once a token arrives.
      const { getAuth } = await import('firebase-admin/auth');
      const decoded = await getAuth(await this.getApp()).verifyIdToken(
        idToken,
        true,
      );
      return {
        ok: true,
        claims: {
          uid: decoded.uid,
          email: decoded.email ?? null,
          audience: decoded.aud,
          issuer: decoded.iss,
          issuedAt: decoded.iat,
          authTime:
            typeof decoded.auth_time === 'number' ? decoded.auth_time : null,
        },
      };
    } catch (error: unknown) {
      const reason = this.classify(error);
      if (reason === 'unavailable') {
        this.logger.error(
          `Firebase token verification unavailable: ${describe(error)}`,
        );
      }
      return { ok: false, reason };
    }
  }

  private classify(error: unknown): FirebaseVerifyFailureReason {
    const code = errorCode(error);
    if (code && EXPIRED_CODES.has(code)) return 'expired';
    if (code && REVOKED_CODES.has(code)) return 'revoked';
    if (code && DISABLED_CODES.has(code)) return 'disabled';
    if (code && UNAVAILABLE_CODES.has(code)) return 'unavailable';
    return 'invalid';
  }

  private async getApp(): Promise<App> {
    if (this.app) {
      return this.app;
    }
    const { getApps, initializeApp } = await import('firebase-admin/app');
    const existing = getApps().find((app) => app.name === APP_NAME);
    this.app =
      existing ?? initializeApp({ projectId: this.projectId }, APP_NAME);
    return this.app;
  }
}

function errorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as {
      code?: unknown;
      errorInfo?: { code?: unknown };
    };
    if (typeof candidate.code === 'string') return candidate.code;
    if (typeof candidate.errorInfo?.code === 'string') {
      return candidate.errorInfo.code;
    }
  }
  return null;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
