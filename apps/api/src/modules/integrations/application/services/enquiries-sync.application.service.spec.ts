import type { AuditLogService } from '../../../../shared/audit';
import { DomainEvent } from '../../../../shared/events/domain-event.base';
import { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import {
  InMemoryEnquiriesDeliveryLog,
  InMemoryEnquiriesSyncStore,
} from '../../infrastructure/testing/in-memory-enquiries-sync.store';
import { createFakeIntegrationDeliveryPrisma } from '../../infrastructure/testing/fake-integration-delivery-prisma';
import { PostgresEnquiriesDeliveryLog } from '../../infrastructure/persistence/postgres-enquiries-delivery-log';
import type { EnquiriesDeliveryLog } from '../ports/enquiries-delivery-log';
import { EventFunctionUsageQuery } from '../../../../shared/application/ports/event-function-usage.query';
import type {
  EnquiriesFunctionInput,
  EnquiriesSyncPayload,
  EnquiriesSyncResponse,
} from '../enquiries-sync.types';
import { EnquiriesSyncApplicationService } from './enquiries-sync.application.service';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
let deliverySeq = 0;
const nextDeliveryId = () =>
  `00000000-0000-4000-8000-${String(++deliverySeq).padStart(12, '0')}`;

function fn(
  id: string,
  overrides: Partial<EnquiriesFunctionInput> = {},
): EnquiriesFunctionInput {
  return {
    functionId: id,
    eventType: 'haldi',
    eventTypeLabel: 'Haldi',
    date: '2026-12-10',
    time: '18:30',
    location: 'Grand Palace',
    locationArea: 'Indiranagar',
    locationAddress: '1 MG Road',
    locationPlaceId: 'place-1',
    lat: 12.97,
    lng: 77.59,
    notes: null,
    ...overrides,
  };
}

function payload(
  overrides: Partial<EnquiriesSyncPayload> = {},
): EnquiriesSyncPayload {
  return {
    schemaVersion: 1,
    source: 'wedecor-enquiries',
    enquiryId: 'enq-1',
    sourceUpdatedAt: '2026-11-23T10:00:00.000Z',
    status: 'approved',
    customer: {
      name: 'Asha Rao',
      phone: '+919876543210',
      email: 'asha@x.test',
    },
    event: {
      eventType: 'wedding',
      eventTypeLabel: 'Wedding',
      startDate: '2026-12-10',
      endDate: '2026-12-12',
      guestCount: 300,
      notes: 'Pastel theme',
      assigneeName: 'Ravi',
    },
    functions: [fn('f-1')],
    money: { totalCost: 250000, advancePaid: 50000, currency: 'INR' },
    ...overrides,
  };
}

function at(isoMinute: number): string {
  return new Date(Date.UTC(2026, 10, 23, 10, isoMinute)).toISOString();
}

describe('EnquiriesSyncApplicationService (M5-01)', () => {
  let store: InMemoryEnquiriesSyncStore;
  let deliveryLog: InMemoryEnquiriesDeliveryLog;
  let published: DomainEvent[];
  let audit: jest.Mocked<Pick<AuditLogService, 'record'>>;
  let inUse: Set<string>;
  let service: EnquiriesSyncApplicationService;
  let buildService: (
    log: EnquiriesDeliveryLog,
  ) => EnquiriesSyncApplicationService;

  const send = async (
    body: EnquiriesSyncPayload,
    deliveryId = nextDeliveryId(),
  ): Promise<EnquiriesSyncResponse> => {
    const result = await service.sync(deliveryId, body);
    if (!result.ok) throw new Error(`unexpected failure ${result.error.code}`);
    return result.value;
  };

  const events = () => [...store.state.events.values()];
  const customers = () => [...store.state.customers.values()];
  const functions = () => [...store.state.functions.values()];

  beforeEach(() => {
    store = new InMemoryEnquiriesSyncStore();
    deliveryLog = new InMemoryEnquiriesDeliveryLog();
    published = [];
    inUse = new Set();
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    const publisher = {
      publish: (event: DomainEvent) => published.push(event),
    };

    const bookingService = new BookingApplicationService(
      store.eventRepository as never,
      {} as never,
      {} as never,
      {} as never,
      publisher,
    );

    const usage: EventFunctionUsageQuery = {
      findInUseFunctionIds: () => Promise.resolve(new Set(inUse)),
    };

    buildService = (log) =>
      new EnquiriesSyncApplicationService(
        store,
        log,
        usage,
        bookingService,
        publisher,
        audit as unknown as AuditLogService,
        { secrets: ['s'.repeat(32)], tenantId: TENANT_ID },
      );
    service = buildService(deliveryLog);
  });

  describe('creating a booking', () => {
    it('creates the customer, booking, functions and link from an approved enquiry', async () => {
      const response = await send(payload());

      expect(response).toEqual({ ok: true, eventId: events()[0].id });
      const [event] = events();
      expect(event).toMatchObject({
        tenantId: TENANT_ID,
        quotationId: null,
        status: 'approved',
        source: 'wedecor-enquiries',
        externalRef: 'enq-1',
        eventType: 'wedding',
        guestCount: 300,
        venueName: 'Grand Palace',
        requirementsNotes: '[From Enquiries] Pastel theme',
        bookingNumber: 1,
      });
      // Calendar dates are stored as UTC midnight: no timezone shifting.
      expect(event.eventStartDate?.toISOString()).toBe(
        '2026-12-10T00:00:00.000Z',
      );
      expect(event.eventEndDate?.toISOString()).toBe(
        '2026-12-12T00:00:00.000Z',
      );

      expect(customers()).toEqual([
        expect.objectContaining({
          displayName: 'Asha Rao',
          phoneNormalized: '+919876543210',
          primaryEmail: 'asha@x.test',
          externalManaged: true,
        }),
      ]);
      expect(functions()).toEqual([
        expect.objectContaining({
          bookingId: event.id,
          externalFunctionId: 'f-1',
          eventType: 'haldi',
          time: '18:30',
          venueName: 'Grand Palace',
          lat: 12.97,
          status: 'active',
          sortOrder: 0,
        }),
      ]);
      const link = [...store.state.links.values()][0];
      expect(link).toMatchObject({
        source: 'wedecor-enquiries',
        externalId: 'enq-1',
        entityType: 'event',
        entityId: event.id,
      });
    });

    it('maps a completed enquiry to a completed booking', async () => {
      await send(payload({ status: 'completed' }));

      expect(events()[0].status).toBe('completed');
      expect(events()[0].completedAt).toBeInstanceOf(Date);
    });

    it('ignores enquiries that were never approved and are not yet synced', async () => {
      for (const status of ['pending', 'cancelled', 'rejected']) {
        const response = await send(
          payload({ status, enquiryId: `enq-${status}` }),
        );
        expect(response).toEqual({
          ok: true,
          ignored: 'not_approved_never_synced',
        });
      }
      expect(events()).toHaveLength(0);
      expect(customers()).toHaveLength(0);
    });

    it('uses the tenant from config for every record', async () => {
      await send(payload());
      expect(events().every((e) => e.tenantId === TENANT_ID)).toBe(true);
      expect(customers().every((c) => c.tenantId === TENANT_ID)).toBe(true);
    });

    it('audits and records every processed delivery without PII', async () => {
      const deliveryId = nextDeliveryId();
      await send(payload(), deliveryId);

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'enquiries.sync_processed',
          entityType: 'Event',
          entityId: events()[0].id,
          outcome: 'success',
          metadata: expect.objectContaining({
            enquiryId: 'enq-1',
            deliveryId,
            result: 'created',
          }),
        }),
      );
      const metadata = JSON.stringify(audit.record.mock.calls[0][0].metadata);
      expect(metadata).not.toContain('9876543210');
      expect(metadata).not.toContain('asha@x.test');
      expect(deliveryLog.entries).toEqual([
        expect.objectContaining({ deliveryId, outcome: 'processed' }),
      ]);
    });

    it('emits booking.synced.created', async () => {
      await send(payload());

      expect(published.map((e) => e.eventName)).toEqual([
        'booking.synced.created',
      ]);
    });
  });

  describe('replay protection', () => {
    it('acknowledges a duplicate delivery id without processing it', async () => {
      const deliveryId = nextDeliveryId();
      await send(payload(), deliveryId);
      const transactions = store.transactionCount;

      const response = await send(
        payload({ sourceUpdatedAt: at(30), customer: { name: 'Changed' } }),
        deliveryId,
      );

      expect(response).toEqual({ ok: true, duplicate: true });
      expect(store.transactionCount).toBe(transactions);
      expect(customers()[0].displayName).toBe('Asha Rao');
    });

    describe('with the Postgres delivery ledger', () => {
      beforeEach(() => {
        const { prisma } = createFakeIntegrationDeliveryPrisma();
        service = buildService(
          new PostgresEnquiriesDeliveryLog(prisma, {
            secrets: [],
            tenantId: TENANT_ID,
          }),
        );
      });

      it('acknowledges a duplicate delivery id with { duplicate: true }', async () => {
        const deliveryId = nextDeliveryId();
        await send(payload(), deliveryId);
        const transactions = store.transactionCount;

        const response = await send(payload(), deliveryId);

        expect(response).toEqual({ ok: true, duplicate: true });
        expect(store.transactionCount).toBe(transactions);
      });

      it('processes the sender retry after a failed delivery', async () => {
        const deliveryId = nextDeliveryId();
        store.failNextTransactionWith = new Error('connection reset');
        await expect(service.sync(deliveryId, payload())).rejects.toThrow(
          'connection reset',
        );

        const response = await send(payload(), deliveryId);

        expect(response).toEqual({ ok: true, eventId: events()[0].id });
      });
    });

    it('releases the claim when processing fails so the sender retry succeeds', async () => {
      const deliveryId = nextDeliveryId();
      store.failNextTransactionWith = new Error('connection reset');

      await expect(service.sync(deliveryId, payload())).rejects.toThrow(
        'connection reset',
      );
      expect(events()).toHaveLength(0);
      expect(deliveryLog.entries).toEqual([
        expect.objectContaining({
          outcome: 'failed',
          detail: 'connection reset',
        }),
      ]);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'failure' }),
      );

      const retry = await send(payload(), deliveryId);
      expect(retry).toEqual({ ok: true, eventId: events()[0].id });
    });
  });

  describe('ordering', () => {
    it('ignores an older update as stale and keeps the newer data', async () => {
      await send(payload({ sourceUpdatedAt: at(10) }));

      const stale = await send(
        payload({
          sourceUpdatedAt: at(5),
          event: { ...payload().event, guestCount: 50 },
        }),
      );

      expect(stale).toEqual({ ok: true, ignored: 'stale' });
      expect(events()[0].guestCount).toBe(300);
    });

    it('treats an identical sourceUpdatedAt as stale (idempotent re-send)', async () => {
      await send(payload({ sourceUpdatedAt: at(10) }));
      const again = await send(payload({ sourceUpdatedAt: at(10) }));

      expect(again).toEqual({ ok: true, ignored: 'stale' });
      expect(events()).toHaveLength(1);
    });

    it('applies out-of-order deliveries so the newest always wins', async () => {
      const newest = payload({
        sourceUpdatedAt: at(20),
        event: { ...payload().event, guestCount: 500 },
      });
      const middle = payload({
        sourceUpdatedAt: at(10),
        event: { ...payload().event, guestCount: 400 },
      });
      const oldest = payload({ sourceUpdatedAt: at(1) });

      await send(newest);
      await send(oldest);
      await send(middle);

      expect(events()).toHaveLength(1);
      expect(events()[0].guestCount).toBe(500);
    });
  });

  describe('lifecycle: create → update → cancel', () => {
    it('updates synced fields, then cancels through the booking cancel service', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));

      const update = await send(
        payload({
          sourceUpdatedAt: at(2),
          event: {
            ...payload().event,
            startDate: '2026-12-11',
            guestCount: 350,
            notes: 'Gold theme',
          },
        }),
      );
      expect(update).toEqual({ ok: true, eventId: events()[0].id });
      expect(events()[0]).toMatchObject({
        guestCount: 350,
        requirementsNotes: '[From Enquiries] Gold theme',
        status: 'approved',
      });
      expect(events()[0].eventStartDate?.toISOString()).toBe(
        '2026-12-11T00:00:00.000Z',
      );

      const cancel = await send(
        payload({ sourceUpdatedAt: at(3), status: 'cancelled' }),
      );
      expect(cancel).toEqual({ ok: true, eventId: events()[0].id });
      expect(events()[0]).toMatchObject({
        status: 'cancelled',
        cancellationReason: 'Cancelled in Enquiries app',
        workspaceStatus: 'archived',
      });

      expect(published.map((e) => e.eventName)).toEqual([
        'booking.synced.created',
        'booking.synced.updated',
        'BookingCancelled', // the existing cancel service's own event
        'booking.synced.cancelled',
      ]);
      expect(customers()).toHaveLength(1);
      expect(events()).toHaveLength(1);
    });

    it('is idempotent when the cancel is redelivered or already applied', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      await send(payload({ sourceUpdatedAt: at(2), status: 'cancelled' }));
      published.length = 0;

      const redelivery = await send(
        payload({ sourceUpdatedAt: at(2), status: 'cancelled' }),
      );

      expect(redelivery).toEqual({ ok: true, ignored: 'stale' });
      expect(published).toHaveLength(0);

      // A newer cancel for an already-cancelled booking only refreshes the link.
      const newer = await send(
        payload({ sourceUpdatedAt: at(9), status: 'cancelled' }),
      );
      expect(newer).toEqual({ ok: true, eventId: events()[0].id });
      expect(published).toHaveLength(0);
    });

    it('retries a cancel whose link update failed without cancelling twice', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      const cancelled = payload({
        sourceUpdatedAt: at(2),
        status: 'cancelled',
      });
      const deliveryId = nextDeliveryId();

      // 1st tx (read) succeeds, cancel happens, 2nd tx (link update) fails.
      const original = store.runInTransaction.bind(store);
      let calls = 0;
      jest
        .spyOn(store, 'runInTransaction')
        .mockImplementation((tenantId, work) => {
          calls += 1;
          if (calls === 2)
            return Promise.reject(new Error('link write failed'));
          return original(tenantId, work);
        });

      await expect(service.sync(deliveryId, cancelled)).rejects.toThrow(
        'link write failed',
      );
      expect(events()[0].status).toBe('cancelled');

      jest.restoreAllMocks();
      const retry = await send(cancelled, deliveryId);
      expect(retry).toEqual({ ok: true, eventId: events()[0].id });
      expect(events()[0].version).toBe(
        // create(1) → update? no; cancel bumped once only
        2,
      );
    });

    it('keeps the EventOS status when Enquiries cancels a completed booking', async () => {
      await send(payload({ sourceUpdatedAt: at(1), status: 'completed' }));

      const response = await send(
        payload({ sourceUpdatedAt: at(2), status: 'cancelled' }),
      );

      expect(response).toEqual({ ok: true, eventId: events()[0].id });
      expect(events()[0].status).toBe('completed');
      const link = [...store.state.links.values()][0];
      expect(link.lastPayload.status).toBe('cancelled');
      expect(deliveryLog.entries.at(-1)?.outcome).toBe('ignored');
    });

    it('keeps the EventOS status for unmapped statuses on a synced booking', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));

      const response = await send(
        payload({ sourceUpdatedAt: at(2), status: 'on_hold' }),
      );

      expect(response).toEqual({ ok: true, eventId: events()[0].id });
      expect(events()[0].status).toBe('approved');
      const link = [...store.state.links.values()][0];
      expect(link.lastPayload.status).toBe('on_hold');
    });

    it('does not revive a cancelled booking when the enquiry is re-approved', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      await send(payload({ sourceUpdatedAt: at(2), status: 'cancelled' }));

      await send(payload({ sourceUpdatedAt: at(3), status: 'approved' }));

      expect(events()[0].status).toBe('cancelled');
    });

    it('advances an approved booking to completed', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      await send(payload({ sourceUpdatedAt: at(2), status: 'completed' }));

      expect(events()[0].status).toBe('completed');
    });

    it('does not emit booking.synced.updated when nothing changed', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      published.length = 0;

      await send(payload({ sourceUpdatedAt: at(2) }));

      expect(published).toHaveLength(0);
    });
  });

  describe('customers', () => {
    it('keeps two customers with the same name apart when their phones differ', async () => {
      await send(payload({ enquiryId: 'enq-a' }));
      await send(
        payload({
          enquiryId: 'enq-b',
          customer: { name: 'Asha Rao', phone: '+919000000001', email: null },
        }),
      );

      expect(customers().map((c) => c.displayName)).toEqual([
        'Asha Rao',
        'Asha Rao',
      ]);
      expect(events()).toHaveLength(2);
      expect(new Set(events().map((e) => e.customerId)).size).toBe(2);
      expect(
        events()
          .map((e) => e.bookingNumber)
          .sort(),
      ).toEqual([1, 2]);
    });

    it('matches an existing customer by normalised phone', async () => {
      await send(payload({ enquiryId: 'enq-a' }));

      await send(
        payload({
          enquiryId: 'enq-b',
          customer: {
            name: 'A. Rao (alt)',
            phone: '00 91 98765 43210',
            email: null,
          },
        }),
      );

      expect(customers()).toHaveLength(1);
      expect(new Set(events().map((e) => e.customerId)).size).toBe(1);
    });

    it('matches by exact email (case-insensitive) when there is no phone match', async () => {
      await send(payload({ enquiryId: 'enq-a' }));

      await send(
        payload({
          enquiryId: 'enq-b',
          customer: { name: 'Asha', phone: null, email: 'ASHA@x.test' },
        }),
      );

      expect(customers()).toHaveLength(1);
    });

    it('updates a feed-managed customer from the source', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));

      await send(
        payload({
          sourceUpdatedAt: at(2),
          customer: {
            name: 'Asha R. Rao',
            phone: '+919876543210',
            email: 'asha.new@x.test',
          },
        }),
      );

      expect(customers()[0]).toMatchObject({
        displayName: 'Asha R. Rao',
        primaryEmail: 'asha.new@x.test',
      });
    });

    it('never overwrites name or email of a customer not managed by the feed', async () => {
      const existing = await store.runInTransaction(TENANT_ID, (tx) =>
        tx.customers.create(TENANT_ID, {
          displayName: 'Asha (VIP)',
          primaryPhone: '+919876543210',
          phoneNormalized: '+919876543210',
          primaryEmail: null,
          externalManaged: false,
        }),
      );

      await send(payload());

      expect(customers()).toHaveLength(1);
      expect(customers()[0]).toMatchObject({
        id: existing.id,
        displayName: 'Asha (VIP)', // not overwritten
        primaryEmail: 'asha@x.test', // blank field filled
        externalManaged: false,
      });
      expect(events()[0].customerId).toBe(existing.id);
    });

    it('creates one customer per delivery even when no contact details are sent', async () => {
      await send(
        payload({
          enquiryId: 'enq-n',
          customer: { name: 'No Contact', phone: null, email: null },
        }),
      );
      await send(
        payload({
          enquiryId: 'enq-n',
          sourceUpdatedAt: at(5),
          customer: { name: 'No Contact', phone: null, email: null },
        }),
      );

      expect(customers()).toHaveLength(1);
    });
  });

  describe('functions', () => {
    it('adds, changes and removes functions on update', async () => {
      await send(
        payload({
          sourceUpdatedAt: at(1),
          functions: [
            fn('f-1'),
            fn('f-2', { eventType: 'sangeet', date: '2026-12-11' }),
          ],
        }),
      );
      expect(functions()).toHaveLength(2);

      await send(
        payload({
          sourceUpdatedAt: at(2),
          functions: [
            fn('f-1', { time: '20:00', location: 'Rose Hall' }), // changed
            fn('f-3', { eventType: 'reception', date: '2026-12-12' }), // added
            // f-2 removed
          ],
        }),
      );

      const byExternal: Record<string, ReturnType<typeof functions>[number]> =
        Object.fromEntries(
          functions().map((f) => [f.externalFunctionId as string, f]),
        );
      expect(Object.keys(byExternal).sort()).toEqual(['f-1', 'f-3']);
      expect(byExternal['f-1']).toMatchObject({
        time: '20:00',
        venueName: 'Rose Hall',
        sortOrder: 0,
        version: 2,
      });
      expect(byExternal['f-3']).toMatchObject({
        eventType: 'reception',
        sortOrder: 1,
      });
      expect(events()[0].venueName).toBe('Rose Hall');
    });

    it('does not rewrite functions that did not change', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      await send(payload({ sourceUpdatedAt: at(2) }));

      expect(functions()[0].version).toBe(1);
    });

    it('marks a removed function that is still in use cancelled instead of deleting it', async () => {
      await send(
        payload({
          sourceUpdatedAt: at(1),
          functions: [fn('f-1'), fn('f-2', { eventType: 'sangeet' })],
        }),
      );
      const f2 = functions().find((f) => f.externalFunctionId === 'f-2');
      inUse.add(f2?.id as string);

      await send(payload({ sourceUpdatedAt: at(2), functions: [fn('f-1')] }));

      expect(functions()).toHaveLength(2);
      expect(
        functions().find((f) => f.externalFunctionId === 'f-2')?.status,
      ).toBe('cancelled');
    });

    it('reactivates a cancelled function when it comes back', async () => {
      await send(
        payload({
          sourceUpdatedAt: at(1),
          functions: [fn('f-1'), fn('f-2')],
        }),
      );
      inUse.add(
        functions().find((f) => f.externalFunctionId === 'f-2')?.id as string,
      );
      await send(payload({ sourceUpdatedAt: at(2), functions: [fn('f-1')] }));

      await send(
        payload({ sourceUpdatedAt: at(3), functions: [fn('f-1'), fn('f-2')] }),
      );

      expect(
        functions().find((f) => f.externalFunctionId === 'f-2')?.status,
      ).toBe('active');
    });

    it('picks the earliest located function as the booking venue', async () => {
      await send(
        payload({
          functions: [
            fn('late', { date: '2026-12-12', location: 'Late Venue' }),
            fn('early', {
              date: '2026-12-10',
              time: '09:00',
              location: 'Early Venue',
            }),
            fn('nolocation', { date: '2026-12-09', location: null }),
          ],
        }),
      );

      expect(events()[0].venueName).toBe('Early Venue');
    });
  });

  describe('money', () => {
    it('stores money on the link and keeps the last value when later deliveries omit it', async () => {
      await send(payload({ sourceUpdatedAt: at(1) }));
      await send(payload({ sourceUpdatedAt: at(2), money: undefined }));

      const link = [...store.state.links.values()][0];
      expect(link.lastPayload.money).toEqual({
        totalCost: 250000,
        advancePaid: 50000,
        currency: 'INR',
      });
    });

    it('never puts money on the booking itself', async () => {
      await send(payload());

      expect(JSON.stringify(events()[0])).not.toContain('250000');
    });
  });

  describe('burst', () => {
    it('stays idempotent across 50 concurrent deliveries (25 enquiries, each sent twice)', async () => {
      const bodies = Array.from({ length: 25 }, (_, i) =>
        payload({
          enquiryId: `enq-${i}`,
          customer: {
            name: `Customer ${i}`,
            phone: `+9190000000${String(i).padStart(2, '0')}`,
            email: null,
          },
        }),
      );
      const deliveries = [...bodies, ...bodies];

      const responses = await Promise.all(deliveries.map((body) => send(body)));

      expect(events()).toHaveLength(25);
      expect(customers()).toHaveLength(25);
      expect(functions()).toHaveLength(25);
      expect(store.state.links.size).toBe(25);
      expect(new Set(events().map((e) => e.bookingNumber)).size).toBe(25);
      expect(responses.filter((r) => 'eventId' in r).length).toBe(25);
      expect(
        responses.filter((r) => 'ignored' in r && r.ignored === 'stale').length,
      ).toBe(25);
    });

    it('converges to the newest payload when 50 versions of one enquiry arrive shuffled', async () => {
      const versions = Array.from({ length: 50 }, (_, i) =>
        payload({
          sourceUpdatedAt: at(i),
          event: { ...payload().event, guestCount: 100 + i },
        }),
      );
      const shuffled = [...versions].sort(
        (a, b) =>
          ((a.event.guestCount as number) % 7) -
          ((b.event.guestCount as number) % 7),
      );

      await Promise.all(shuffled.map((body) => send(body)));

      expect(events()).toHaveLength(1);
      expect(events()[0].guestCount).toBe(149);
    });
  });
});
