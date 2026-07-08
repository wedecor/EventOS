import type { CustomerStatus, CustomerType } from '@prisma/client';

export type CustomerRecord = {
  id: string;
  tenantId: string;
  displayName: string;
  type: CustomerType;
  status: CustomerStatus;
  primaryPhone: string | null;
  primaryEmail: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateCustomerData = {
  displayName: string;
  type?: CustomerType;
  status?: CustomerStatus;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  notes?: string | null;
};

export type UpdateCustomerData = {
  displayName?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  notes?: string | null;
};

export abstract class CustomerRepository {
  abstract create(
    tenantId: string,
    data: CreateCustomerData,
  ): Promise<CustomerRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<CustomerRecord | null>;

  abstract findByPhone(
    tenantId: string,
    phone: string,
  ): Promise<CustomerRecord[]>;

  abstract findByDisplayName(
    tenantId: string,
    displayName: string,
  ): Promise<CustomerRecord | null>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateCustomerData,
    version: number,
  ): Promise<CustomerRecord>;
}
