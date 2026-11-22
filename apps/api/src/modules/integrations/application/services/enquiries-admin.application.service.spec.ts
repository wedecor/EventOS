import {
  InMemoryEnquiriesDeliveryLog,
  InMemoryEnquiriesSyncStore,
} from '../../infrastructure/testing/in-memory-enquiries-sync.store';
import { EnquiriesAdminApplicationService } from './enquiries-admin.application.service';

const TENANT = 'tenant-1';

describe('EnquiriesAdminApplicationService (M5-01)', () => {
  let store: InMemoryEnquiriesSyncStore;
  let log: InMemoryEnquiriesDeliveryLog;
  let service: EnquiriesAdminApplicationService;

  const link = (
    externalId: string,
    entityId: string,
    sourceUpdatedAt: string,
    lastPayload: Record<string, unknown> = {},
  ) =>
    store.runInTransaction(TENANT, (tx) =>
      tx.upsertLink({
        source: 'wedecor-enquiries',
        externalId,
        entityType: 'event',
        entityId,
        lastSourceUpdatedAt: new Date(sourceUpdatedAt),
        lastPayload,
        lastDeliveryId: 'd',
        syncedAt: new Date('2026-11-23T11:00:00Z'),
      }),
    );

  beforeEach(() => {
    store = new InMemoryEnquiriesSyncStore();
    log = new InMemoryEnquiriesDeliveryLog();
    service = new EnquiriesAdminApplicationService(store, log);
  });

  describe('getStatus', () => {
    it('summarises the last 24 h and the most recent errors', async () => {
      const at = new Date('2026-11-23T10:00:00Z');
      await log.record({
        at,
        deliveryId: 'd1',
        enquiryId: 'e1',
        outcome: 'processed',
      });
      await log.record({
        at,
        deliveryId: 'd2',
        enquiryId: 'e2',
        outcome: 'stale',
      });
      await log.record({
        at,
        deliveryId: 'd3',
        enquiryId: 'e3',
        outcome: 'ignored',
      });
      await log.record({
        at,
        deliveryId: 'd4',
        enquiryId: 'e4',
        outcome: 'failed',
        detail: 'boom',
      });

      const result = await service.getStatus();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.last24h).toEqual({
          processed: 1,
          stale: 1,
          ignored: 1,
          failed: 1,
        });
        expect(result.value.lastDeliveryAt).toBe('2026-11-23T10:00:00.000Z');
        expect(result.value.recentErrors).toEqual([
          {
            at: '2026-11-23T10:00:00.000Z',
            deliveryId: 'd4',
            enquiryId: 'e4',
            message: 'boom',
          },
        ]);
      }
    });

    it('reports an empty feed', async () => {
      const result = await service.getStatus();

      expect(result.ok && result.value.lastDeliveryAt).toBeNull();
    });
  });

  describe('backfillCheck', () => {
    it('classifies enquiries as missing, stale or up to date', async () => {
      await link('known-current', 'ev-1', '2026-11-23T10:00:00Z');
      await link('known-old', 'ev-2', '2026-11-20T10:00:00Z');

      const result = await service.backfillCheck(TENANT, [
        { enquiryId: 'unknown', sourceUpdatedAt: '2026-11-23T10:00:00Z' },
        { enquiryId: 'known-current', sourceUpdatedAt: '2026-11-23T10:00:00Z' },
        { enquiryId: 'known-old', sourceUpdatedAt: '2026-11-23T10:00:00Z' },
      ]);

      expect(result).toEqual({
        ok: true,
        value: { missing: ['unknown'], stale: ['known-old'], upToDate: 1 },
      });
    });

    it('handles an empty list', async () => {
      const result = await service.backfillCheck(TENANT, []);

      expect(result).toEqual({
        ok: true,
        value: { missing: [], stale: [], upToDate: 0 },
      });
    });
  });

  describe('getSyncedFinancials', () => {
    it('returns the synced money for a booking', async () => {
      await link('e1', 'ev-1', '2026-11-23T10:00:00Z', {
        money: { totalCost: 250000, advancePaid: 50000, currency: 'INR' },
      });

      const result = await service.getSyncedFinancials(TENANT, 'ev-1');

      expect(result).toEqual({
        ok: true,
        value: {
          bookingId: 'ev-1',
          totalCost: 250000,
          advancePaid: 50000,
          currency: 'INR',
          syncedAt: '2026-11-23T11:00:00.000Z',
        },
      });
    });

    it('is NOT_FOUND for bookings without synced money or a link', async () => {
      await link('e1', 'ev-1', '2026-11-23T10:00:00Z', {});

      for (const bookingId of ['ev-1', 'native-booking']) {
        const result = await service.getSyncedFinancials(TENANT, bookingId);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe('NOT_FOUND');
      }
    });
  });
});
