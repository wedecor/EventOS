import type { StaffAssignmentStatus } from '@prisma/client';

// EP1-STF-002 — Staff summary: tenant-wide assignment mix and on-site lead coverage for
// staff/vendor coordination visibility (read-only projection of StaffAssignment data).
export type StaffSummaryDto = {
  totalAssignments: number;
  byStatus: Partial<Record<StaffAssignmentStatus, number>>;
  onSiteLeadCount: number;
  unconfirmedForUpcomingEvents: number;
};
