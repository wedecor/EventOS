// Auth Module domain layer — R1-10 password reuse prevention (docs/14 §Password
// Requirements). Persistence-only port: it stores and reads retired password hashes
// and holds no policy logic. The reuse decision lives in the Application layer.
// Tenant-scoped per ADR-016.
export abstract class PasswordHistoryRepository {
  // Most recent retired password hashes for a user, newest first, capped at `limit`.
  abstract findRecentHashes(
    tenantId: string,
    userId: string,
    limit: number,
  ): Promise<string[]>;

  // Append a retired password hash to the user's history.
  abstract add(
    tenantId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void>;
}
