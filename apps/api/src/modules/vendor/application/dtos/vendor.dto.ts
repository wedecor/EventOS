import type { VendorRecord } from '../../domain/repositories/vendor.repository';

export type VendorDto = {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  status: VendorRecord['status'];
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

export function toVendorDto(record: VendorRecord): VendorDto {
  return { ...record };
}
