export type AuthSessionRecord = {
  id: string;
  tenantId: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
};

export abstract class AuthSessionRepository {
  abstract create(data: {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSessionRecord>;

  abstract findActiveByTokenHash(
    tokenHash: string,
  ): Promise<AuthSessionRecord | null>;

  abstract revoke(id: string): Promise<void>;
}
