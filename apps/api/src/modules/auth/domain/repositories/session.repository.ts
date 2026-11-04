// Auth Module domain layer (docs/10 §Auth Module: `SessionRepository`).
// A Session is one issued refresh token (ADR-008 refresh-token rotation). The raw
// refresh token is never stored — only its hash. Rotation revokes the presented
// session and creates a new one; logout / force-logout set `revokedAt`.

export type SessionRecord = {
  id: string;
  tenantId: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSessionData = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

export abstract class SessionRepository {
  abstract create(
    tenantId: string,
    data: CreateSessionData,
  ): Promise<SessionRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<SessionRecord | null>;

  // Idempotent: revoking an already-revoked or unknown session is a no-op.
  abstract revoke(tenantId: string, id: string): Promise<void>;

  // Force-logout: revoke every active session for a user (docs/14 §Session
  // Management "Force logout: Invalidate all refresh tokens for a user").
  abstract revokeAllForUser(tenantId: string, userId: string): Promise<void>;
}
