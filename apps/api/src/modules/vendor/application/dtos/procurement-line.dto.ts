import type { ProcurementLineRecord } from '../../domain/repositories/procurement-line.repository';

export type ProcurementLineDto = {
  id: string;
  tenantId: string;
  vendorProcurementId: string;
  bookingId: string;
  quotationLineItemId: string | null;
  description: string;
  category: string;
  quantity: number;
  budgetedAmount: number | null;
  actualAmount: number | null;
  currency: string;
  status: ProcurementLineRecord['status'];
  requestedAt: Date | null;
  confirmedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  costVarianceAmount: number | null;
  costVarianceReason: ProcurementLineRecord['costVarianceReason'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toProcurementLineDto(
  record: ProcurementLineRecord,
): ProcurementLineDto {
  return { ...record };
}
