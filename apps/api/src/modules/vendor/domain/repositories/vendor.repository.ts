import type { VendorStatus } from '@prisma/client';

export type VendorRecord = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  status: VendorStatus;
  contactName: string | null;
  contactPhone: string | null;
  location: string | null;
  servicesProvided: string | null;
  pricingNotes: string | null;
  paymentTerms: string | null;
  taxDetails: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateVendorData = {
  name: string;
  category: string;
  status?: VendorStatus;
  contactName?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  servicesProvided?: string | null;
  pricingNotes?: string | null;
  paymentTerms?: string | null;
  taxDetails?: string | null;
  notes?: string | null;
};

export type UpdateVendorData = {
  name?: string;
  category?: string;
  status?: VendorStatus;
  contactName?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  servicesProvided?: string | null;
  pricingNotes?: string | null;
  paymentTerms?: string | null;
  taxDetails?: string | null;
  notes?: string | null;
};

export type FindVendorsFilter = {
  status?: VendorStatus;
  category?: string;
};

export abstract class VendorRepository {
  abstract create(
    tenantId: string,
    data: CreateVendorData,
  ): Promise<VendorRecord>;

  abstract findById(tenantId: string, id: string): Promise<VendorRecord | null>;

  abstract findMany(
    tenantId: string,
    filter?: FindVendorsFilter,
  ): Promise<VendorRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateVendorData,
    version: number,
  ): Promise<VendorRecord>;
}
