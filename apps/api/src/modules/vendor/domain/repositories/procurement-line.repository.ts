import type { CostVarianceReason, ProcurementLineStatus } from '@prisma/client';

export type ProcurementLineRecord = {
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
  status: ProcurementLineStatus;
  requestedAt: Date | null;
  confirmedAt: Date | null;
  deliveredAt: Date | null;
  completedAt: Date | null;
  costVarianceAmount: number | null;
  costVarianceReason: CostVarianceReason | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateProcurementLineData = {
  description: string;
  category: string;
  quantity?: number;
  budgetedAmount?: number | null;
  currency?: string;
  quotationLineItemId?: string | null;
  notes?: string | null;
};

export type UpdateProcurementLineData = {
  status?: ProcurementLineStatus;
  actualAmount?: number | null;
  costVarianceAmount?: number | null;
  costVarianceReason?: CostVarianceReason | null;
  notes?: string | null;
  requestedAt?: Date | null;
  confirmedAt?: Date | null;
  deliveredAt?: Date | null;
  completedAt?: Date | null;
};

export abstract class ProcurementLineRepository {
  abstract create(
    tenantId: string,
    vendorProcurementId: string,
    bookingId: string,
    data: CreateProcurementLineData,
  ): Promise<ProcurementLineRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ProcurementLineRecord | null>;

  abstract findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementLineRecord[]>;

  // EP1-VEN-003, EP1-VEN-005 — Dashboard: tenant-wide procurement line read for vendor summary
  abstract findAll(tenantId: string): Promise<ProcurementLineRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateProcurementLineData,
    version: number,
  ): Promise<ProcurementLineRecord>;
}
