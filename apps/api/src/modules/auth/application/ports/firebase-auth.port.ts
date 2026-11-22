// M5-01 (ADR-019 phase 1) — application-layer port for verifying a Firebase ID
// token. The exchange service depends only on this abstraction; the
// infrastructure adapter wraps `firebase-admin`, and tests use an in-memory
// adapter. TEMPORARY: delete with the Firebase login bridge (ADR-019 phase 3).

export type FirebaseIdTokenClaims = {
  /** Firebase user id (`sub` / `uid`). */
  uid: string;
  email: string | null;
  /** `aud` claim — must equal the configured Firebase project id. */
  audience: string;
  /** `iss` claim — must be `https://securetoken.google.com/<projectId>`. */
  issuer: string;
  /** `iat` (seconds since epoch). */
  issuedAt: number;
  /** `auth_time` (seconds since epoch) when present. */
  authTime: number | null;
};

export type FirebaseVerifyFailureReason =
  'invalid' | 'expired' | 'revoked' | 'disabled' | 'unavailable';

export type FirebaseVerifyResult =
  | { ok: true; claims: FirebaseIdTokenClaims }
  | { ok: false; reason: FirebaseVerifyFailureReason };

export abstract class FirebaseAuthPort {
  /** The Firebase project this port verifies tokens for. */
  abstract getProjectId(): string;

  /**
   * Verifies signature, expiry, revocation and disabled state of an ID token.
   * Never throws for token problems — returns a typed failure instead.
   */
  abstract verifyIdToken(idToken: string): Promise<FirebaseVerifyResult>;
}
