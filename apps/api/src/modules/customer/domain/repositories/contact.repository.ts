export type ContactRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  createdAt: Date;
};

export type CreateContactData = {
  customerId: string;
  name: string;
  role: string;
  phone?: string | null;
  email?: string | null;
};

export abstract class ContactRepository {
  abstract create(
    tenantId: string,
    data: CreateContactData,
  ): Promise<ContactRecord>;

  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<ContactRecord[]>;

  abstract countByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<number>;
}
