import { DomainEvent } from './domain-event.base';
import type { SuggestionRecord } from '../../modules/admin/domain/repositories/suggestion.repository';
import type { EventRecord } from '../../modules/booking/domain/repositories/event.repository';
import type { TaskRecord } from '../../modules/task/domain/repositories/task.repository';
import type { StaffAssignmentRecord } from '../../modules/staff/domain/repositories/staff-assignment.repository';
import type { StaffMemberRecord } from '../../modules/staff/domain/repositories/staff-member.repository';
import type { TenantSettingsRecord } from '../../modules/tenant/domain/repositories/tenant-settings.repository';

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

// EP1-BR-003 — Execution owner assigned/reassigned on a booking
export class ExecutionOwnerAssignedEvent extends DomainEvent {
  readonly eventName = 'ExecutionOwnerAssigned';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
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

// EP1-OPS-003 — Task created for a booking's execution checklist
export class TaskCreatedEvent extends DomainEvent {
  readonly eventName = 'TaskCreated';

  constructor(
    readonly tenantId: string,
    readonly task: TaskRecord,
  ) {
    super();
  }
}

// EP1-OPS-003 — Task fields updated
export class TaskUpdatedEvent extends DomainEvent {
  readonly eventName = 'TaskUpdated';

  constructor(
    readonly tenantId: string,
    readonly task: TaskRecord,
  ) {
    super();
  }
}

// EP1-OPS-003 — Task marked completed
export class TaskCompletedEvent extends DomainEvent {
  readonly eventName = 'TaskCompleted';

  constructor(
    readonly tenantId: string,
    readonly task: TaskRecord,
  ) {
    super();
  }
}

// EP1-STF-002 — Staff assignment proposed (recommendation pending Zakir confirmation)
export class StaffAssignmentCreatedEvent extends DomainEvent {
  readonly eventName = 'StaffAssignmentCreated';

  constructor(
    readonly tenantId: string,
    readonly staffAssignment: StaffAssignmentRecord,
  ) {
    super();
  }
}

// EP1-STF-002, EP1-AUT-004 — Staff assignment confirmed by human approval
export class StaffAssignmentConfirmedEvent extends DomainEvent {
  readonly eventName = 'StaffAssignmentConfirmed';

  constructor(
    readonly tenantId: string,
    readonly staffAssignment: StaffAssignmentRecord,
  ) {
    super();
  }
}

// EP1-STF-002 — Staff assignment released (event complete / assignment closed)
export class StaffAssignmentReleasedEvent extends DomainEvent {
  readonly eventName = 'StaffAssignmentReleased';

  constructor(
    readonly tenantId: string,
    readonly staffAssignment: StaffAssignmentRecord,
  ) {
    super();
  }
}

// EP1-STF-002 — Staff assignment withdrawn/cancelled
export class StaffAssignmentCancelledEvent extends DomainEvent {
  readonly eventName = 'StaffAssignmentCancelled';

  constructor(
    readonly tenantId: string,
    readonly staffAssignment: StaffAssignmentRecord,
  ) {
    super();
  }
}

// EP1-STF-001 — Staff master profile created
export class StaffMemberCreatedEvent extends DomainEvent {
  readonly eventName = 'StaffMemberCreated';

  constructor(
    readonly tenantId: string,
    readonly staffMember: StaffMemberRecord,
  ) {
    super();
  }
}

// EP1-STF-001 — Staff master fields updated (no status change)
export class StaffMemberUpdatedEvent extends DomainEvent {
  readonly eventName = 'StaffMemberUpdated';

  constructor(
    readonly tenantId: string,
    readonly staffMember: StaffMemberRecord,
  ) {
    super();
  }
}

// EP1-STF-001 — Staff master status changed (active / inactive / on_leave)
export class StaffMemberStatusChangedEvent extends DomainEvent {
  readonly eventName = 'StaffMemberStatusChanged';

  constructor(
    readonly tenantId: string,
    readonly staffMember: StaffMemberRecord,
    readonly fromStatus: StaffMemberRecord['status'],
  ) {
    super();
  }
}

// EP1-AUT-001 / ADR-017 — Suggestion accepted (human confirmation)
export class SuggestionAcceptedEvent extends DomainEvent {
  readonly eventName = 'SuggestionAccepted';

  constructor(
    readonly tenantId: string,
    readonly suggestion: SuggestionRecord,
  ) {
    super();
  }
}

// EP1-AUT-001 / ADR-017 — Suggestion dismissed
export class SuggestionDismissedEvent extends DomainEvent {
  readonly eventName = 'SuggestionDismissed';

  constructor(
    readonly tenantId: string,
    readonly suggestion: SuggestionRecord,
  ) {
    super();
  }
}

// R3-04 / EP1-KPI-007 — Tenant settings updated
export class TenantSettingsUpdatedEvent extends DomainEvent {
  readonly eventName = 'TenantSettingsUpdated';

  constructor(
    readonly tenantId: string,
    readonly settings: TenantSettingsRecord,
  ) {
    super();
  }
}
