import type { VendorExpenseRecord } from '../../domain/repositories/vendor-expense.repository';

export type VendorExpenseDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  procurementLineId: string | null;
  amount: number;
  currency: string;
  method: VendorExpenseRecord['method'];
  status: VendorExpenseRecord['status'];
  paidAt: Date;
  attachmentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toVendorExpenseDto(
  record: VendorExpenseRecord,
): VendorExpenseDto {
  return { ...record };
}
