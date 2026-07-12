import type { PreparationStatus, WorkspaceStatus } from '@prisma/client';

// EP1-OPS-004, EP1-OPS-001 — Event execution summary: preparation/workspace status mix across
// active (non-cancelled, non-completed) bookings — read-only projection of Event data.
export type EventExecutionSummaryDto = {
  activeEventCount: number;
  byPreparationStatus: Partial<Record<PreparationStatus, number>>;
  byWorkspaceStatus: Partial<Record<WorkspaceStatus, number>>;
  needsAttentionCount: number;
};
