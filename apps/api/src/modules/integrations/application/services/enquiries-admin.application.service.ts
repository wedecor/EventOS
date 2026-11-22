import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EnquiriesSyncStore } from '../../domain/repositories/enquiries-sync.store';
import { ENQUIRIES_SOURCE } from '../enquiries-sync.types';
import {
  EnquiriesDeliveryLog,
  type DeliverySummary,
} from '../ports/enquiries-delivery-log';

const STATUS_ERROR_LIMIT = 20;

export type EnquiriesFeedStatusDto = {
  lastDeliveryAt: string | null;
  last24h: DeliverySummary['last24h'];
  recentErrors: Array<{
    at: string;
    deliveryId: string;
    enquiryId: string;
    message: string;
  }>;
};

export type BackfillCheckItem = { enquiryId: string; sourceUpdatedAt: string };

export type BackfillCheckDto = {
  /** Enquiries unknown to EventOS (never synced). */
  missing: string[];
  /** Known, but EventOS holds an older `sourceUpdatedAt` than the sender. */
  stale: string[];
  upToDate: number;
};

export type SyncedFinancialsDto = {
  bookingId: string;
  totalCost: number;
  advancePaid: number;
  currency: string;
  syncedAt: string;
};

@Injectable()
export class EnquiriesAdminApplicationService {
  constructor(
    private readonly store: EnquiriesSyncStore,
    private readonly deliveryLog: EnquiriesDeliveryLog,
  ) {}

  /** Operational view of the feed (owner/admin). */
  async getStatus(): Promise<Result<EnquiriesFeedStatusDto>> {
    const summary = await this.deliveryLog.summarize(STATUS_ERROR_LIMIT);
    return success({
      lastDeliveryAt: summary.lastDeliveryAt?.toISOString() ?? null,
      last24h: summary.last24h,
      recentErrors: summary.recentErrors.map((error) => ({
        ...error,
        at: error.at.toISOString(),
      })),
    });
  }

  /** Reconciliation for the backfill script: which enquiries are missing or stale? */
  async backfillCheck(
    tenantId: string,
    items: readonly BackfillCheckItem[],
  ): Promise<Result<BackfillCheckDto>> {
    const links = await this.store.findLinksByExternalIds(
      tenantId,
      ENQUIRIES_SOURCE,
      items.map((item) => item.enquiryId),
    );
    const known = new Map(
      links.map((link) => [link.externalId, link.lastSourceUpdatedAt]),
    );

    const missing: string[] = [];
    const stale: string[] = [];
    let upToDate = 0;
    for (const item of items) {
      const lastSeen = known.get(item.enquiryId);
      if (!lastSeen) {
        missing.push(item.enquiryId);
      } else if (
        lastSeen.getTime() < new Date(item.sourceUpdatedAt).getTime()
      ) {
        stale.push(item.enquiryId);
      } else {
        upToDate += 1;
      }
    }
    return success({ missing, stale, upToDate });
  }

  /** Synced `money` for a booking; only reachable with `integrations:financials:read`. */
  async getSyncedFinancials(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<SyncedFinancialsDto>> {
    const link = await this.store.findLinkByEntity(
      tenantId,
      ENQUIRIES_SOURCE,
      'event',
      bookingId,
    );
    const money = link?.lastPayload.money as
      { totalCost: number; advancePaid: number; currency: string } | undefined;
    if (!link || !money) {
      return failure(
        'NOT_FOUND',
        'No synced financial summary exists for this booking.',
      );
    }
    return success({
      bookingId,
      totalCost: money.totalCost,
      advancePaid: money.advancePaid,
      currency: money.currency,
      syncedAt: link.syncedAt.toISOString(),
    });
  }
}
