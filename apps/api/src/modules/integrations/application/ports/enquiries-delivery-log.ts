export type DeliveryOutcome = 'processed' | 'stale' | 'ignored' | 'failed';

export type DeliveryLogEntry = {
  at: Date;
  deliveryId: string;
  enquiryId: string;
  outcome: DeliveryOutcome;
  /** Error message for failed deliveries (never contains payload data). */
  detail?: string;
};

export type DeliverySummary = {
  lastDeliveryAt: Date | null;
  last24h: Record<DeliveryOutcome, number>;
  recentErrors: Array<{
    at: Date;
    deliveryId: string;
    enquiryId: string;
    message: string;
  }>;
};

/**
 * Replay ledger + operational log for feed deliveries. Postgres is the source of
 * truth (`PostgresEnquiriesDeliveryLog`); ordering by `sourceUpdatedAt` already
 * makes processing idempotent — the ledger only avoids redundant work.
 */
export abstract class EnquiriesDeliveryLog {
  /** Claim a delivery id. `true` when first seen; `false` for a duplicate. */
  abstract claim(deliveryId: string): Promise<boolean>;

  /** Release a claim after a failed delivery so the sender's retry is processed. */
  abstract release(deliveryId: string): Promise<void>;

  abstract record(entry: DeliveryLogEntry): Promise<void>;

  abstract summarize(errorLimit: number): Promise<DeliverySummary>;
}
