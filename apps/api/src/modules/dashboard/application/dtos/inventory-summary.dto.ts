import type { InventoryMovementStatus } from '@prisma/client';

// EP1-INV-003, EP1-INV-005 — Inventory summary: tenant-wide movement status mix, read-only
// projection of InventoryMovement data (event stock movement + returns/cleaning visibility).
export type InventorySummaryDto = {
  totalMovements: number;
  byStatus: Partial<Record<InventoryMovementStatus, number>>;
  awaitingCleanupCount: number;
};
