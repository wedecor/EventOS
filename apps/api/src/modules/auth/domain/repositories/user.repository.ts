// Auth Module domain layer (docs/10 §Auth Module: `UserRepository`).
// The User aggregate is the identity record for a person who can authenticate.
// Phase 1 is single-tenant (ADR-016): every user belongs to the seeded We Decor
// tenant and all lookups are tenant-scoped.

export type UserRecord = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  // Nullable: a user provisioned without a password cannot authenticate yet.
  // Never exposed through DTOs — used only for credential verification.
  passwordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export abstract class UserRepository {
  abstract findByEmail(
    tenantId: string,
    email: string,
  ): Promise<UserRecord | null>;

  abstract findById(tenantId: string, id: string): Promise<UserRecord | null>;

  // R1-10 — replace a user's password hash (self-service change; docs/14 §Password
  // Requirements). Persistence-only; all business rules are enforced upstream in the
  // Application layer before this is called.
  abstract updatePassword(
    tenantId: string,
    userId: string,
    passwordHash: string,
  ): Promise<void>;
}
