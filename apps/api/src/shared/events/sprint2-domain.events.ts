import { DomainEvent } from './domain-event.base';
import type { EventRecord } from '../../modules/booking/domain/repositories/event.repository';

// EP1-OPS-001, EP1-AUT-002 — Workspace activated for an approved event
export class WorkspaceActivatedEvent extends DomainEvent {
  readonly eventName = 'WorkspaceActivated';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
  ) {
    super();
  }
}

// EP1-OPS-004 — Execution progress advanced (milestone/preparation status)
export class ExecutionProgressAdvancedEvent extends DomainEvent {
  readonly eventName = 'ExecutionProgressAdvanced';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
    readonly milestoneKey: string,
  ) {
    super();
  }
}

// Booking cancelled with reason
export class BookingCancelledEvent extends DomainEvent {
  readonly eventName = 'BookingCancelled';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
  ) {
    super();
  }
}

// Event marked completed (EP1-BR-002 gate)
export class EventCompletedEvent extends DomainEvent {
  readonly eventName = 'EventCompleted';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
  ) {
    super();
  }
}
