import type { PaymentMethod } from '@prisma/client';

export type VendorExpenseRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  procurementLineId: string | null;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'confirmed' | 'void';
  paidAt: Date;
  attachmentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateVendorExpenseData = {
  bookingId: string;
  vendorId: string;
  procurementLineId?: string | null;
  amount: number;
  currency?: string;
  method: string;
  paidAt: Date;
  attachmentId?: string | null;
  notes?: string | null;
};

export type UpdateVendorExpenseData = {
  status?: VendorExpenseRecord['status'];
};

export abstract class VendorExpenseRepository {
  abstract create(
    tenantId: string,
    data: CreateVendorExpenseData,
  ): Promise<VendorExpenseRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<VendorExpenseRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<VendorExpenseRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateVendorExpenseData,
    version: number,
  ): Promise<VendorExpenseRecord>;
}
