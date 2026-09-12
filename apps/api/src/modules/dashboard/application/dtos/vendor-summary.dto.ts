import type { ProcurementLineStatus, VendorStatus } from '@prisma/client';

export type ProcurementLinesSummaryDto = {
  total: number;
  byStatus: Partial<Record<ProcurementLineStatus, number>>;
  costVarianceFlaggedCount: number;
};

// EP1-VEN-001, EP1-VEN-003, EP1-VEN-005 — Vendor summary: vendor master status/category mix
// plus tenant-wide procurement line status and cost-variance visibility (read-only projection).
export type VendorSummaryDto = {
  totalVendors: number;
  byStatus: Partial<Record<VendorStatus, number>>;
  byCategory: Record<string, number>;
  procurementLines: ProcurementLinesSummaryDto;
};
