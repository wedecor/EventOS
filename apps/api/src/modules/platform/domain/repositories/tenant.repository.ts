export type TenantRecord = {
  id: string;
  name: string;
  slug: string;
};

export abstract class TenantRepository {
  abstract findBySlug(slug: string): Promise<TenantRecord | null>;

  abstract findById(id: string): Promise<TenantRecord | null>;
}
