export type UserRecord = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  passwordHash: string | null;
  version: number;
};

export abstract class UserRepository {
  abstract findByTenantAndEmail(
    tenantId: string,
    email: string,
  ): Promise<UserRecord | null>;

  abstract findById(tenantId: string, id: string): Promise<UserRecord | null>;
}
