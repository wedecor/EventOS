export type ContactRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateContactData = {
  customerId: string;
  name: string;
  role?: string | null;
  phone?: string | null;
  email?: string | null;
  isPrimary?: boolean;
};

export abstract class ContactRepository {
  abstract create(
    tenantId: string,
    data: CreateContactData,
  ): Promise<ContactRecord>;

  abstract countByCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<number>;
}
