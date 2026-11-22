import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../../../database/redis.constants';
import {
  EnquiriesDeliveryLog,
  type DeliveryLogEntry,
  type DeliveryOutcome,
  type DeliverySummary,
} from '../../application/ports/enquiries-delivery-log';

const PREFIX = 'enquiries:feed:';
const DELIVERY_TTL_SECONDS = 24 * 60 * 60;
const WINDOW_MS = DELIVERY_TTL_SECONDS * 1000;
const MAX_LOG_ENTRIES = 5_000;
const MAX_ERROR_ENTRIES = 20;

type StoredEntry = {
  at: number;
  deliveryId: string;
  enquiryId: string;
  outcome: DeliveryOutcome;
  detail?: string;
};

@Injectable()
export class RedisEnquiriesDeliveryLog extends EnquiriesDeliveryLog {
  private readonly logger = new Logger(RedisEnquiriesDeliveryLog.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {
    super();
  }

  async claim(deliveryId: string): Promise<boolean> {
    try {
      const result = await this.redis.set(
        `${PREFIX}delivery:${deliveryId}`,
        '1',
        'EX',
        DELIVERY_TTL_SECONDS,
        'NX',
      );
      return result === 'OK';
    } catch (error: unknown) {
      // Fail open: `sourceUpdatedAt` ordering keeps processing idempotent.
      this.logger.warn(
        `Delivery ledger unavailable (claim): ${describe(error)}`,
      );
      return true;
    }
  }

  async release(deliveryId: string): Promise<void> {
    try {
      await this.redis.del(`${PREFIX}delivery:${deliveryId}`);
    } catch (error: unknown) {
      this.logger.warn(
        `Delivery ledger unavailable (release): ${describe(error)}`,
      );
    }
  }

  async record(entry: DeliveryLogEntry): Promise<void> {
    const stored: StoredEntry = {
      at: entry.at.getTime(),
      deliveryId: entry.deliveryId,
      enquiryId: entry.enquiryId,
      outcome: entry.outcome,
      ...(entry.detail ? { detail: entry.detail } : {}),
    };
    const serialised = JSON.stringify(stored);

    try {
      const pipeline = this.redis
        .multi()
        .zadd(`${PREFIX}log`, stored.at, serialised)
        .zremrangebyscore(`${PREFIX}log`, '-inf', stored.at - WINDOW_MS)
        .zremrangebyrank(`${PREFIX}log`, 0, -(MAX_LOG_ENTRIES + 1))
        .set(`${PREFIX}last`, String(stored.at));
      if (entry.outcome === 'failed') {
        pipeline
          .lpush(`${PREFIX}errors`, serialised)
          .ltrim(`${PREFIX}errors`, 0, MAX_ERROR_ENTRIES - 1);
      }
      await pipeline.exec();
    } catch (error: unknown) {
      this.logger.warn(`Delivery log unavailable (record): ${describe(error)}`);
    }
  }

  async summarize(errorLimit: number): Promise<DeliverySummary> {
    const counts: Record<DeliveryOutcome, number> = {
      processed: 0,
      stale: 0,
      ignored: 0,
      failed: 0,
    };

    try {
      const since = Date.now() - WINDOW_MS;
      const [lastRaw, logRaw, errorsRaw] = await Promise.all([
        this.redis.get(`${PREFIX}last`),
        this.redis.zrangebyscore(`${PREFIX}log`, since, '+inf'),
        this.redis.lrange(`${PREFIX}errors`, 0, errorLimit - 1),
      ]);

      for (const raw of logRaw) {
        const entry = parse(raw);
        if (entry) counts[entry.outcome] += 1;
      }

      return {
        lastDeliveryAt: lastRaw ? new Date(Number(lastRaw)) : null,
        last24h: counts,
        recentErrors: errorsRaw.flatMap((raw) => {
          const entry = parse(raw);
          return entry
            ? [
                {
                  at: new Date(entry.at),
                  deliveryId: entry.deliveryId,
                  enquiryId: entry.enquiryId,
                  message: entry.detail ?? 'Unknown error',
                },
              ]
            : [];
        }),
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Delivery log unavailable (summarize): ${describe(error)}`,
      );
      return { lastDeliveryAt: null, last24h: counts, recentErrors: [] };
    }
  }
}

function parse(raw: string): StoredEntry | null {
  try {
    return JSON.parse(raw) as StoredEntry;
  } catch {
    return null;
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
