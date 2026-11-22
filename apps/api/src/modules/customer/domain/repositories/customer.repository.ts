import type { CustomerStatus, CustomerType } from '@prisma/client';

export type CustomerRecord = {
  id: string;
  tenantId: string;
  displayName: string;
  type: CustomerType;
  status: CustomerStatus;
  primaryPhone: string | null;
  primaryEmail: string | null;
  /** M5-01 — strict E.164 form used for feed matching; null when not normalisable. */
  phoneNormalized: string | null;
  /** M5-01 — true while created by an external feed and never edited in EventOS. */
  externalManaged: boolean;
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
  phoneNormalized?: string | null;
  externalManaged?: boolean;
  notes?: string | null;
};

export type UpdateCustomerData = {
  displayName?: string;
  type?: CustomerType;
  status?: CustomerStatus;
  primaryPhone?: string | null;
  primaryEmail?: string | null;
  phoneNormalized?: string | null;
  externalManaged?: boolean;
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

  /** M5-01 — exact (E.164) match; at most one per tenant (unique index). */
  abstract findByPhoneNormalized(
    tenantId: string,
    phoneNormalized: string,
  ): Promise<CustomerRecord | null>;

  /** M5-01 — case-insensitive exact email match. */
  abstract findByEmail(
    tenantId: string,
    email: string,
  ): Promise<CustomerRecord | null>;

  abstract findByDisplayName(
    tenantId: string,
    displayName: string,
  ): Promise<CustomerRecord | null>;

  /** P2-12 — Tenant-wide customer list for retention analytics. */
  abstract findAll(tenantId: string): Promise<CustomerRecord[]>;

  abstract findPage(
    tenantId: string,
    options: {
      page: number;
      pageSize: number;
      q?: string;
      sort?: 'createdAt' | 'name';
      order?: 'asc' | 'desc';
    },
  ): Promise<{ items: CustomerRecord[]; total: number }>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateCustomerData,
    version: number,
  ): Promise<CustomerRecord>;

  abstract listAll(tenantId: string): Promise<CustomerRecord[]>;
}
