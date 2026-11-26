import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { ENQUIRIES_SOURCE } from '../../application/enquiries-sync.types';
import {
  EnquiriesDeliveryLog,
  type DeliveryLogEntry,
  type DeliveryOutcome,
  type DeliverySummary,
} from '../../application/ports/enquiries-delivery-log';
import { EnquiriesFeedConfig } from '../../application/ports/enquiries-feed.config';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Ledger rows older than this are purged lazily on `record` (no cron). */
const RETENTION_MS = 7 * DAY_MS;
/** A claim with no recorded outcome this old is a crashed attempt: re-claimable. */
const STALE_CLAIM_MS = 10 * 60 * 1000;

/**
 * Postgres-backed replay ledger + operational log for Enquiries deliveries
 * (`integration_deliveries`). Source of truth whether or not Redis is
 * configured, so duplicate protection survives cold starts and restarts.
 *
 * Lifecycle: `claim` inserts a row (outcome NULL); `record` stores the outcome;
 * `release` deletes the claim after a failure so the sender's retry runs, and
 * the following `record` leaves a `failed` row that a retry may re-claim.
 */
@Injectable()
export class PostgresEnquiriesDeliveryLog extends EnquiriesDeliveryLog {
  private readonly logger = new Logger(PostgresEnquiriesDeliveryLog.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: EnquiriesFeedConfig,
  ) {
    super();
  }

  async claim(deliveryId: string): Promise<boolean> {
    const now = new Date();
    // Retry of a failed (or crashed, never-completed) delivery takes the row over.
    const reclaimed = await this.prisma.integrationDelivery.updateMany({
      where: {
        deliveryId,
        OR: [
          { outcome: 'failed' },
          {
            outcome: null,
            receivedAt: { lt: new Date(now.getTime() - STALE_CLAIM_MS) },
          },
        ],
      },
      data: {
        outcome: null,
        enquiryId: null,
        detail: null,
        receivedAt: now,
      },
    });
    if (reclaimed.count > 0) {
      return true;
    }

    // INSERT … ON CONFLICT DO NOTHING: 1 row inserted → first sighting.
    const inserted = await this.prisma.integrationDelivery.createMany({
      data: [
        {
          deliveryId,
          tenantId: this.config.tenantId,
          source: ENQUIRIES_SOURCE,
          receivedAt: now,
        },
      ],
      skipDuplicates: true,
    });
    return inserted.count === 1;
  }

  async release(deliveryId: string): Promise<void> {
    try {
      await this.prisma.integrationDelivery.deleteMany({
        where: { deliveryId },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Delivery ledger unavailable (release): ${describe(error)}`,
      );
    }
  }

  async record(entry: DeliveryLogEntry): Promise<void> {
    try {
      await this.prisma.integrationDelivery.upsert({
        where: { deliveryId: entry.deliveryId },
        create: {
          deliveryId: entry.deliveryId,
          tenantId: this.config.tenantId,
          source: ENQUIRIES_SOURCE,
          receivedAt: entry.at,
          outcome: entry.outcome,
          enquiryId: entry.enquiryId,
          detail: entry.detail ?? null,
        },
        update: {
          outcome: entry.outcome,
          enquiryId: entry.enquiryId,
          detail: entry.detail ?? null,
        },
      });
      await this.prisma.integrationDelivery.deleteMany({
        where: { receivedAt: { lt: new Date(Date.now() - RETENTION_MS) } },
      });
    } catch (error: unknown) {
      // Best effort: never fail an already-committed delivery over its log row.
      this.logger.warn(`Delivery log unavailable (record): ${describe(error)}`);
    }
  }

  async summarize(errorLimit: number): Promise<DeliverySummary> {
    const tenantId = this.config.tenantId;
    const since = new Date(Date.now() - DAY_MS);
    const completed = { tenantId, outcome: { not: null } };

    const [last, grouped, errors] = await Promise.all([
      this.prisma.integrationDelivery.aggregate({
        where: completed,
        _max: { receivedAt: true },
      }),
      this.prisma.integrationDelivery.groupBy({
        by: ['outcome'],
        where: { ...completed, receivedAt: { gte: since } },
        _count: { _all: true },
      }),
      this.prisma.integrationDelivery.findMany({
        where: { tenantId, outcome: 'failed', receivedAt: { gte: since } },
        orderBy: { receivedAt: 'desc' },
        take: errorLimit,
      }),
    ]);

    const last24h: Record<DeliveryOutcome, number> = {
      processed: 0,
      stale: 0,
      ignored: 0,
      failed: 0,
    };
    for (const row of grouped) {
      if (row.outcome && row.outcome in last24h) {
        last24h[row.outcome as DeliveryOutcome] = row._count._all;
      }
    }

    return {
      lastDeliveryAt: last._max.receivedAt ?? null,
      last24h,
      recentErrors: errors.map((row) => ({
        at: row.receivedAt,
        deliveryId: row.deliveryId,
        enquiryId: row.enquiryId ?? '',
        message: row.detail ?? 'Unknown error',
      })),
    };
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
