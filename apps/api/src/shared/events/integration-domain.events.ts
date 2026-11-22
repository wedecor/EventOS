import { DomainEvent } from './domain-event.base';
import type { EventRecord } from '../../modules/booking/domain/repositories/event.repository';

// M5-01 — emitted after an external source (Enquiries feed) creates / updates /
// cancels a booking. No handlers beyond the audit log exist yet; they are the
// hook for later features (e.g. notifications, gig planning — P3-01).

export class BookingSyncedCreatedEvent extends DomainEvent {
  readonly eventName = 'booking.synced.created';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
    readonly source: string,
    readonly externalId: string,
  ) {
    super();
  }
}

export class BookingSyncedUpdatedEvent extends DomainEvent {
  readonly eventName = 'booking.synced.updated';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
    readonly source: string,
    readonly externalId: string,
    readonly changedFields: readonly string[],
  ) {
    super();
  }
}

export class BookingSyncedCancelledEvent extends DomainEvent {
  readonly eventName = 'booking.synced.cancelled';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
    readonly source: string,
    readonly externalId: string,
  ) {
    super();
  }
}
