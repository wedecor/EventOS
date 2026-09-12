import type { ProcurementLineStatus } from '@prisma/client';

export type VendorProcurementRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  status: ProcurementLineStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateVendorProcurementData = {
  bookingId: string;
  vendorId: string;
  notes?: string | null;
};

export abstract class VendorProcurementRepository {
  abstract create(
    tenantId: string,
    data: CreateVendorProcurementData,
  ): Promise<VendorProcurementRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<VendorProcurementRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<VendorProcurementRecord[]>;
}
