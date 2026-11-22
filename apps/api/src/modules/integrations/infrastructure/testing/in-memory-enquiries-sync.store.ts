import { randomUUID } from 'node:crypto';
import { ConcurrentModificationError } from '../../../../shared/database';
import type {
  CreateCustomerData,
  CustomerRecord,
  UpdateCustomerData,
} from '../../../customer/domain/repositories/customer.repository';
import type {
  CreateEventData,
  EventRecord,
  UpdateEventData,
} from '../../../booking/domain/repositories/event.repository';
import type {
  CreateEventFunctionData,
  EventFunctionRecord,
  UpdateEventFunctionData,
} from '../../../booking/domain/repositories/event-function.repository';
import {
  EnquiriesSyncStore,
  EnquiriesSyncTransaction,
  type ExternalRecordLinkRecord,
  type UpsertExternalRecordLinkData,
} from '../../domain/repositories/enquiries-sync.store';
import {
  EnquiriesDeliveryLog,
  type DeliveryLogEntry,
  type DeliverySummary,
} from '../../application/ports/enquiries-delivery-log';

/**
 * Test doubles for the Enquiries feed ports. They mirror the behaviour the
 * services rely on (versioning, per-tenant uniqueness, transaction rollback,
 * serialised deliveries) so lifecycle scenarios run without a database.
 */
type State = {
  customers: Map<string, CustomerRecord>;
  events: Map<string, EventRecord>;
  functions: Map<string, EventFunctionRecord>;
  links: Map<string, ExternalRecordLinkRecord>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class InMemoryEnquiriesSyncStore extends EnquiriesSyncStore {
  state: State = {
    customers: new Map(),
    events: new Map(),
    functions: new Map(),
    links: new Map(),
  };

  /** Throw once from the next `runInTransaction` (simulates a transient DB error). */
  failNextTransactionWith: Error | null = null;
  transactionCount = 0;

  private queue: Promise<unknown> = Promise.resolve();

  readonly eventRepository = {
    findById: (tenantId: string, id: string) =>
      Promise.resolve(this.findEvent(tenantId, id)),
    update: (
      tenantId: string,
      id: string,
      data: UpdateEventData,
      version: number,
    ) =>
      Promise.resolve(
        this.updateEvent(this.state, tenantId, id, data, version),
      ),
  };

  runInTransaction<T>(
    tenantId: string,
    work: (tx: EnquiriesSyncTransaction) => Promise<T>,
  ): Promise<T> {
    // The advisory lock serialises deliveries; the queue emulates that.
    const run = async (): Promise<T> => {
      this.transactionCount += 1;
      const snapshot: State = {
        customers: clone(this.state.customers),
        events: clone(this.state.events),
        functions: clone(this.state.functions),
        links: clone(this.state.links),
      };
      try {
        if (this.failNextTransactionWith) {
          const error = this.failNextTransactionWith;
          this.failNextTransactionWith = null;
          throw error;
        }
        return await work(new InMemoryTransaction(tenantId, this));
      } catch (error: unknown) {
        this.state = snapshot; // rollback
        throw error;
      }
    };
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined);
    return result;
  }

  findLinksByExternalIds(
    tenantId: string,
    source: string,
    externalIds: readonly string[],
  ) {
    return Promise.resolve(
      [...this.state.links.values()]
        .filter(
          (link) =>
            link.tenantId === tenantId &&
            link.source === source &&
            externalIds.includes(link.externalId),
        )
        .map((link) => ({
          externalId: link.externalId,
          lastSourceUpdatedAt: link.lastSourceUpdatedAt,
        })),
    );
  }

  findLinkByEntity(
    tenantId: string,
    source: string,
    entityType: string,
    entityId: string,
  ) {
    return Promise.resolve(
      [...this.state.links.values()].find(
        (link) =>
          link.tenantId === tenantId &&
          link.source === source &&
          link.entityType === entityType &&
          link.entityId === entityId,
      ) ?? null,
    );
  }

  // --- helpers shared with the transaction ---------------------------------

  findEvent(tenantId: string, id: string): EventRecord | null {
    const event = this.state.events.get(id);
    return event && event.tenantId === tenantId ? clone(event) : null;
  }

  updateEvent(
    state: State,
    tenantId: string,
    id: string,
    data: UpdateEventData,
    version: number,
  ): EventRecord {
    const current = state.events.get(id);
    if (
      !current ||
      current.tenantId !== tenantId ||
      current.version !== version
    ) {
      throw new ConcurrentModificationError('Event', id);
    }
    const next: EventRecord = {
      ...current,
      ...data,
      version: current.version + 1,
      updatedAt: new Date(),
    };
    state.events.set(id, next);
    return clone(next);
  }
}

class InMemoryTransaction extends EnquiriesSyncTransaction {
  constructor(
    private readonly tenantId: string,
    private readonly store: InMemoryEnquiriesSyncStore,
  ) {
    super();
  }

  private get state(): State {
    return this.store.state;
  }

  async lockFeed(): Promise<void> {
    await Promise.resolve();
  }

  findLink(source: string, externalId: string) {
    const link = this.state.links.get(
      `${this.tenantId}|${source}|${externalId}`,
    );
    return Promise.resolve(link ? clone(link) : null);
  }

  upsertLink(data: UpsertExternalRecordLinkData) {
    const key = `${this.tenantId}|${data.source}|${data.externalId}`;
    const existing = this.state.links.get(key);
    const record: ExternalRecordLinkRecord = {
      id: existing?.id ?? randomUUID(),
      tenantId: this.tenantId,
      ...clone(data),
    };
    this.state.links.set(key, record);
    return Promise.resolve(clone(record));
  }

  readonly customers = {
    create: (tenantId: string, data: CreateCustomerData) => {
      const phoneNormalized = data.phoneNormalized ?? null;
      if (
        phoneNormalized &&
        [...this.state.customers.values()].some(
          (c) =>
            c.tenantId === tenantId && c.phoneNormalized === phoneNormalized,
        )
      ) {
        return Promise.reject(new Error('Unique violation: phoneNormalized'));
      }
      const record: CustomerRecord = {
        id: randomUUID(),
        tenantId,
        displayName: data.displayName,
        type: data.type ?? 'individual',
        status: data.status ?? 'active',
        primaryPhone: data.primaryPhone ?? null,
        primaryEmail: data.primaryEmail ?? null,
        phoneNormalized,
        externalManaged: data.externalManaged ?? false,
        notes: data.notes ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      this.state.customers.set(record.id, record);
      return Promise.resolve(clone(record));
    },
    update: (
      tenantId: string,
      id: string,
      data: UpdateCustomerData,
      version: number,
    ) => {
      const current = this.state.customers.get(id);
      if (
        !current ||
        current.tenantId !== tenantId ||
        current.version !== version
      ) {
        return Promise.reject(new ConcurrentModificationError('Customer', id));
      }
      const next: CustomerRecord = {
        ...current,
        ...data,
        version: current.version + 1,
        updatedAt: new Date(),
      };
      this.state.customers.set(id, next);
      return Promise.resolve(clone(next));
    },
    findById: (tenantId: string, id: string) => {
      const customer = this.state.customers.get(id);
      return Promise.resolve(
        customer && customer.tenantId === tenantId ? clone(customer) : null,
      );
    },
    findByPhoneNormalized: (tenantId: string, phone: string) =>
      Promise.resolve(
        clone(
          [...this.state.customers.values()].find(
            (c) => c.tenantId === tenantId && c.phoneNormalized === phone,
          ) ?? null,
        ),
      ),
    findByEmail: (tenantId: string, email: string) =>
      Promise.resolve(
        clone(
          [...this.state.customers.values()].find(
            (c) =>
              c.tenantId === tenantId &&
              c.primaryEmail?.toLowerCase() === email.toLowerCase(),
          ) ?? null,
        ),
      ),
  };

  readonly events = {
    create: (tenantId: string, data: CreateEventData) => {
      if (
        [...this.state.events.values()].some(
          (e) =>
            e.tenantId === tenantId && e.bookingNumber === data.bookingNumber,
        )
      ) {
        return Promise.reject(new Error('Unique violation: bookingNumber'));
      }
      const record: EventRecord = {
        id: randomUUID(),
        tenantId,
        customerId: data.customerId,
        leadId: data.leadId ?? null,
        quotationId: data.quotationId,
        bookingNumber: data.bookingNumber,
        status: data.status ?? 'approved',
        eventType: data.eventType ?? null,
        eventStartDate: data.eventStartDate ?? null,
        eventEndDate: data.eventEndDate ?? null,
        venueName: data.venueName ?? null,
        guestCount: data.guestCount ?? null,
        requirementsNotes: data.requirementsNotes ?? null,
        workspaceStatus: data.workspaceStatus ?? 'inactive',
        preparationStatus: data.preparationStatus ?? 'pending',
        operationalMilestone: data.operationalMilestone ?? null,
        executionOwnerId: data.executionOwnerId ?? null,
        cancellationReason: null,
        completedAt: data.completedAt ?? null,
        source: data.source ?? 'eventos',
        externalRef: data.externalRef ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      this.state.events.set(record.id, record);
      return Promise.resolve(clone(record));
    },
    update: (
      tenantId: string,
      id: string,
      data: UpdateEventData,
      version: number,
    ) => {
      try {
        return Promise.resolve(
          this.store.updateEvent(this.state, tenantId, id, data, version),
        );
      } catch (error: unknown) {
        return Promise.reject(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    },
    findById: (tenantId: string, id: string) =>
      Promise.resolve(this.store.findEvent(tenantId, id)),
    findMaxBookingNumber: (tenantId: string) =>
      Promise.resolve(
        Math.max(
          0,
          ...[...this.state.events.values()]
            .filter((e) => e.tenantId === tenantId)
            .map((e) => e.bookingNumber),
        ),
      ),
  };

  readonly functions = {
    listByBooking: (tenantId: string, bookingId: string) =>
      Promise.resolve(
        clone(
          [...this.state.functions.values()]
            .filter((f) => f.tenantId === tenantId && f.bookingId === bookingId)
            .sort((a, b) => a.sortOrder - b.sortOrder),
        ),
      ),
    create: (
      tenantId: string,
      bookingId: string,
      data: CreateEventFunctionData,
    ) => {
      const record: EventFunctionRecord = {
        id: randomUUID(),
        tenantId,
        bookingId,
        externalFunctionId: data.externalFunctionId ?? null,
        eventType: data.eventType,
        eventTypeLabel: data.eventTypeLabel ?? null,
        date: data.date,
        time: data.time ?? null,
        venueName: data.venueName ?? null,
        venueArea: data.venueArea ?? null,
        venueAddress: data.venueAddress ?? null,
        placeId: data.placeId ?? null,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        notes: data.notes ?? null,
        sortOrder: data.sortOrder ?? 0,
        status: data.status ?? 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      this.state.functions.set(record.id, record);
      return Promise.resolve(clone(record));
    },
    update: (
      tenantId: string,
      id: string,
      data: UpdateEventFunctionData,
      version: number,
    ) => {
      const current = this.state.functions.get(id);
      if (
        !current ||
        current.tenantId !== tenantId ||
        current.version !== version
      ) {
        return Promise.reject(
          new ConcurrentModificationError('EventFunction', id),
        );
      }
      const next: EventFunctionRecord = {
        ...current,
        ...data,
        version: current.version + 1,
        updatedAt: new Date(),
      };
      this.state.functions.set(id, next);
      return Promise.resolve(clone(next));
    },
    delete: (tenantId: string, id: string) => {
      const current = this.state.functions.get(id);
      if (current && current.tenantId === tenantId) {
        this.state.functions.delete(id);
      }
      return Promise.resolve();
    },
  };
}

export class InMemoryEnquiriesDeliveryLog extends EnquiriesDeliveryLog {
  readonly claimed = new Set<string>();
  readonly entries: DeliveryLogEntry[] = [];

  claim(deliveryId: string): Promise<boolean> {
    if (this.claimed.has(deliveryId)) {
      return Promise.resolve(false);
    }
    this.claimed.add(deliveryId);
    return Promise.resolve(true);
  }

  release(deliveryId: string): Promise<void> {
    this.claimed.delete(deliveryId);
    return Promise.resolve();
  }

  record(entry: DeliveryLogEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  summarize(errorLimit: number): Promise<DeliverySummary> {
    const counts = { processed: 0, stale: 0, ignored: 0, failed: 0 };
    for (const entry of this.entries) counts[entry.outcome] += 1;
    const errors = this.entries
      .filter((entry) => entry.outcome === 'failed')
      .slice(-errorLimit)
      .reverse()
      .map((entry) => ({
        at: entry.at,
        deliveryId: entry.deliveryId,
        enquiryId: entry.enquiryId,
        message: entry.detail ?? 'Unknown error',
      }));
    return Promise.resolve({
      lastDeliveryAt: this.entries.at(-1)?.at ?? null,
      last24h: counts,
      recentErrors: errors,
    });
  }
}
