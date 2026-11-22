export type WorkspaceProgressDto = {
  eventId: string;
  overallCompletionPercent: number;
  tasksComplete: number;
  tasksTotal: number;
  checklistComplete: number;
  checklistTotal: number;
  pendingActions: number;
  inventory: {
    reserved: number;
    packed: number;
    loaded: number;
    returned: number;
    damaged: number;
    /** Additive P2-07 — open movements needing operational action. */
    outstandingActions: number;
  };
  /** Additive P2-08 — finance document summary for workspace composition. */
  financeDocuments: {
    total: number;
    pendingVerification: number;
    verified: number;
    rejected: number;
    missingPaymentProofs: number;
    outstandingActions: number;
  };
  /** Additive P2-09 — communication + reminder summary for workspace composition. */
  communications: {
    total: number;
    failed: number;
    pendingReminders: number;
    overdueReminders: number;
    outstandingActions: number;
  };
};

export type WorkspaceActivityItemDto = {
  id: string;
  type: string;
  title: string;
  occurredAt: Date;
  entityType?: string;
  entityId?: string;
};
