import type { VendorProcurementRecord } from '../../domain/repositories/vendor-procurement.repository';
import { type ProcurementLineDto } from './procurement-line.dto';

export type VendorProcurementDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  status: VendorProcurementRecord['status'];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  lines: ProcurementLineDto[];
};

// EP1-VEN-002 — Procurement lines are embedded per `docs/09-api-design.md` §7 read coverage
// notes: "Procurement line state and variance flags are returned by
// GET /api/v1/bookings/:id/procurements".
export function toVendorProcurementDto(
  record: VendorProcurementRecord,
  lines: ProcurementLineDto[],
): VendorProcurementDto {
  return { ...record, lines };
}
