import { ENQUIRIES_SOURCE } from '../../application/enquiries-sync.types';
import { createFakeIntegrationDeliveryPrisma } from '../testing/fake-integration-delivery-prisma';
import { PostgresEnquiriesDeliveryLog } from './postgres-enquiries-delivery-log';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const DAY_MS = 24 * 60 * 60 * 1000;

function build() {
  const fake = createFakeIntegrationDeliveryPrisma();
  const log = new PostgresEnquiriesDeliveryLog(fake.prisma, {
    secrets: [],
    tenantId: TENANT_ID,
  });
  return { ...fake, log };
}

describe('PostgresEnquiriesDeliveryLog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-27T00:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('claim / release', () => {
    it('inserts the first sighting with tenant and source from config', async () => {
      const { log, rows } = build();

      await expect(log.claim('d-1')).resolves.toBe(true);

      expect(rows.get('d-1')).toMatchObject({
        deliveryId: 'd-1',
        tenantId: TENANT_ID,
        source: ENQUIRIES_SOURCE,
        outcome: null,
      });
    });

    it('returns false for a duplicate delivery id (ON CONFLICT DO NOTHING)', async () => {
      const { log, rows } = build();
      await log.claim('d-1');

      await expect(log.claim('d-1')).resolves.toBe(false);
      expect(rows.size).toBe(1);
    });

    it('treats a completed delivery as a duplicate', async () => {
      const { log } = build();
      await log.claim('d-1');
      await log.record({
        at: new Date(),
        deliveryId: 'd-1',
        enquiryId: 'enq-1',
        outcome: 'processed',
      });

      await expect(log.claim('d-1')).resolves.toBe(false);
    });

    it('release deletes the claim so a retry can claim again', async () => {
      const { log, rows } = build();
      await log.claim('d-1');

      await log.release('d-1');

      expect(rows.has('d-1')).toBe(false);
      await expect(log.claim('d-1')).resolves.toBe(true);
    });

    it('lets a retry re-claim a delivery recorded as failed', async () => {
      const { log, rows } = build();
      await log.claim('d-1');
      await log.release('d-1');
      await log.record({
        at: new Date(),
        deliveryId: 'd-1',
        enquiryId: 'enq-1',
        outcome: 'failed',
        detail: 'connection reset',
      });
      expect(rows.get('d-1')?.outcome).toBe('failed');

      await expect(log.claim('d-1')).resolves.toBe(true);
      expect(rows.get('d-1')).toMatchObject({ outcome: null, detail: null });
      await expect(log.claim('d-1')).resolves.toBe(false);
    });

    it('lets a retry take over a stale claim from a crashed attempt', async () => {
      const { log } = build();
      await log.claim('d-1');

      jest.advanceTimersByTime(5 * 60 * 1000);
      await expect(log.claim('d-1')).resolves.toBe(false);

      jest.advanceTimersByTime(6 * 60 * 1000);
      await expect(log.claim('d-1')).resolves.toBe(true);
    });
  });

  describe('record', () => {
    it('updates the claimed row with outcome and enquiry id', async () => {
      const { log, rows } = build();
      await log.claim('d-1');

      await log.record({
        at: new Date(),
        deliveryId: 'd-1',
        enquiryId: 'enq-1',
        outcome: 'stale',
      });

      expect(rows.get('d-1')).toMatchObject({
        outcome: 'stale',
        enquiryId: 'enq-1',
      });
      expect(rows.size).toBe(1);
    });

    it('lazily purges rows older than 7 days', async () => {
      const { log, rows } = build();
      await log.claim('old');
      jest.advanceTimersByTime(8 * DAY_MS);
      await log.claim('recent');

      await log.record({
        at: new Date(),
        deliveryId: 'recent',
        enquiryId: 'enq-1',
        outcome: 'processed',
      });

      expect([...rows.keys()]).toEqual(['recent']);
    });

    it('swallows ledger errors so a committed delivery is never failed', async () => {
      const { log, prisma } = build();
      (prisma.integrationDelivery as unknown as { upsert: jest.Mock }).upsert =
        jest.fn().mockRejectedValue(new Error('db down'));

      await expect(
        log.record({
          at: new Date(),
          deliveryId: 'd-1',
          enquiryId: 'enq-1',
          outcome: 'processed',
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('summarize', () => {
    it('counts the last 24 h, ignores open claims and lists recent errors', async () => {
      const { log } = build();
      const record = (
        deliveryId: string,
        outcome: 'processed' | 'failed' | 'ignored',
        detail?: string,
      ) =>
        log.record({
          at: new Date(),
          deliveryId,
          enquiryId: `enq-${deliveryId}`,
          outcome,
          detail,
        });

      await record('old', 'processed');
      jest.advanceTimersByTime(30 * 60 * 60 * 1000); // 30 h later: `old` is outside 24 h
      await record('a', 'processed');
      await record('b', 'processed');
      await record('c', 'ignored');
      jest.advanceTimersByTime(1000);
      await record('e1', 'failed', 'boom');
      await log.claim('in-flight');

      const summary = await log.summarize(20);

      expect(summary.last24h).toEqual({
        processed: 2,
        stale: 0,
        ignored: 1,
        failed: 1,
      });
      expect(summary.recentErrors).toEqual([
        {
          at: new Date(),
          deliveryId: 'e1',
          enquiryId: 'enq-e1',
          message: 'boom',
        },
      ]);
      expect(summary.lastDeliveryAt).toEqual(new Date());
    });

    it('returns an empty summary when nothing was delivered', async () => {
      const { log } = build();

      await expect(log.summarize(20)).resolves.toEqual({
        lastDeliveryAt: null,
        last24h: { processed: 0, stale: 0, ignored: 0, failed: 0 },
        recentErrors: [],
      });
    });
  });
});
