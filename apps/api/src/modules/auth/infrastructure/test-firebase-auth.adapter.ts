import { Injectable } from '@nestjs/common';
import {
  FirebaseAuthPort,
  type FirebaseIdTokenClaims,
  type FirebaseVerifyFailureReason,
  type FirebaseVerifyResult,
} from '../application/ports/firebase-auth.port';

/**
 * In-memory {@link FirebaseAuthPort} for unit tests and local development
 * (`FIREBASE_AUTH_PROVIDER=test`). Refused in staging/production by env
 * validation. Accepts either tokens registered via {@link register}/{@link fail}
 * or the shorthand `test:<uid>[:<email>]`.
 */
@Injectable()
export class TestFirebaseAuthAdapter extends FirebaseAuthPort {
  private readonly registered = new Map<string, FirebaseVerifyResult>();

  constructor(
    private readonly projectId = 'test-project',
    private readonly now: () => number = () => Math.floor(Date.now() / 1000),
  ) {
    super();
  }

  getProjectId(): string {
    return this.projectId;
  }

  register(
    idToken: string,
    claims: Partial<FirebaseIdTokenClaims> & { uid: string },
  ): void {
    this.registered.set(idToken, { ok: true, claims: this.claims(claims) });
  }

  fail(idToken: string, reason: FirebaseVerifyFailureReason): void {
    this.registered.set(idToken, { ok: false, reason });
  }

  verifyIdToken(idToken: string): Promise<FirebaseVerifyResult> {
    const known = this.registered.get(idToken);
    if (known) {
      return Promise.resolve(known);
    }

    const match = /^test:([^:]+)(?::(.+))?$/.exec(idToken);
    if (match) {
      return Promise.resolve({
        ok: true,
        claims: this.claims({ uid: match[1], email: match[2] ?? null }),
      });
    }

    return Promise.resolve({ ok: false, reason: 'invalid' });
  }

  private claims(
    partial: Partial<FirebaseIdTokenClaims> & { uid: string },
  ): FirebaseIdTokenClaims {
    const issuedAt = partial.issuedAt ?? this.now();
    return {
      uid: partial.uid,
      email: partial.email ?? null,
      audience: partial.audience ?? this.projectId,
      issuer:
        partial.issuer ?? `https://securetoken.google.com/${this.projectId}`,
      issuedAt,
      authTime: partial.authTime ?? issuedAt,
    };
  }
}

/** Used when `FIREBASE_AUTH_PROVIDER=none`: the exchange endpoint rejects every token. */
@Injectable()
export class DisabledFirebaseAuthAdapter extends FirebaseAuthPort {
  constructor(private readonly projectId: string) {
    super();
  }

  getProjectId(): string {
    return this.projectId;
  }

  verifyIdToken(): Promise<FirebaseVerifyResult> {
    return Promise.resolve({ ok: false, reason: 'invalid' });
  }
}
