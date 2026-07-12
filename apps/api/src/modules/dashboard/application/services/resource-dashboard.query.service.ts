import { Injectable } from '@nestjs/common';
import type {
  InventoryMovementStatus,
  ProcurementLineStatus,
  StaffAssignmentStatus,
  VendorStatus,
} from '@prisma/client';
import { success, type Result } from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { InventoryMovementRepository } from '../../../inventory/domain/repositories/inventory-movement.repository';
import { StaffAssignmentRepository } from '../../../staff/domain/repositories/staff-assignment.repository';
import { ProcurementLineRepository } from '../../../vendor/domain/repositories/procurement-line.repository';
import { VendorRepository } from '../../../vendor/domain/repositories/vendor.repository';
import type { InventorySummaryDto } from '../dtos/inventory-summary.dto';
import type { StaffSummaryDto } from '../dtos/staff-summary.dto';
import type { VendorSummaryDto } from '../dtos/vendor-summary.dto';

// EP1-STF-002, EP1-INV-003, EP1-INV-005, EP1-VEN-001, EP1-VEN-003, EP1-VEN-005 — Staff,
// inventory, and vendor coordination dashboards (Z3). Read-only aggregation of StaffAssignment,
// InventoryMovement, Vendor, and ProcurementLine data — no business logic duplication (statuses
// are read verbatim; state transitions remain owned by their respective application services).
@Injectable()
export class ResourceDashboardQueryService {
  constructor(
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly procurementLineRepository: ProcurementLineRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async getStaffSummary(tenantId: string): Promise<Result<StaffSummaryDto>> {
    const [assignments, upcomingEvents] = await Promise.all([
      this.staffAssignmentRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, { from: new Date() }),
    ]);

    const byStatus: Partial<Record<StaffAssignmentStatus, number>> = {};
    for (const assignment of assignments) {
      byStatus[assignment.status] = (byStatus[assignment.status] ?? 0) + 1;
    }

    const upcomingBookingIds = new Set(
      upcomingEvents
        .filter((event) => event.status !== 'cancelled')
        .map((event) => event.id),
    );
    const unconfirmedForUpcomingEvents = assignments.filter(
      (assignment) =>
        assignment.status === 'proposed' &&
        upcomingBookingIds.has(assignment.bookingId),
    ).length;

    return success({
      totalAssignments: assignments.length,
      byStatus,
      onSiteLeadCount: assignments.filter((a) => a.isOnSiteLead).length,
      unconfirmedForUpcomingEvents,
    });
  }

  async getInventorySummary(
    tenantId: string,
  ): Promise<Result<InventorySummaryDto>> {
    const movements = await this.inventoryMovementRepository.findAll(tenantId);

    const byStatus: Partial<Record<InventoryMovementStatus, number>> = {};
    for (const movement of movements) {
      byStatus[movement.status] = (byStatus[movement.status] ?? 0) + 1;
    }

    return success({
      totalMovements: movements.length,
      byStatus,
      awaitingCleanupCount: movements.filter((m) => m.status === 'returned')
        .length,
    });
  }

  async getVendorSummary(tenantId: string): Promise<Result<VendorSummaryDto>> {
    const [vendors, procurementLines] = await Promise.all([
      this.vendorRepository.findMany(tenantId),
      this.procurementLineRepository.findAll(tenantId),
    ]);

    const byStatus: Partial<Record<VendorStatus, number>> = {};
    const byCategory: Record<string, number> = {};
    for (const vendor of vendors) {
      byStatus[vendor.status] = (byStatus[vendor.status] ?? 0) + 1;
      byCategory[vendor.category] = (byCategory[vendor.category] ?? 0) + 1;
    }

    const linesByStatus: Partial<Record<ProcurementLineStatus, number>> = {};
    for (const line of procurementLines) {
      linesByStatus[line.status] = (linesByStatus[line.status] ?? 0) + 1;
    }

    return success({
      totalVendors: vendors.length,
      byStatus,
      byCategory,
      procurementLines: {
        total: procurementLines.length,
        byStatus: linesByStatus,
        costVarianceFlaggedCount: procurementLines.filter(
          (line) => line.costVarianceReason !== null,
        ).length,
      },
    });
  }
}
