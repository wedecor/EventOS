import { DomainEvent } from './domain-event.base';
import type { VendorRecord } from '../../modules/vendor/domain/repositories/vendor.repository';
import type { VendorIssueNoteRecord } from '../../modules/vendor/domain/repositories/vendor-issue-note.repository';
import type { VendorProcurementRecord } from '../../modules/vendor/domain/repositories/vendor-procurement.repository';
import type { ProcurementLineRecord } from '../../modules/vendor/domain/repositories/procurement-line.repository';
import type { ProcurementLineIssueNoteRecord } from '../../modules/vendor/domain/repositories/procurement-line-issue-note.repository';

// EP1-VEN-001 — Vendor created
export class VendorCreatedEvent extends DomainEvent {
  readonly eventName = 'VendorCreated';

  constructor(
    readonly tenantId: string,
    readonly vendor: VendorRecord,
  ) {
    super();
  }
}

// EP1-VEN-001 — Vendor fields updated (no status change)
export class VendorUpdatedEvent extends DomainEvent {
  readonly eventName = 'VendorUpdated';

  constructor(
    readonly tenantId: string,
    readonly vendor: VendorRecord,
  ) {
    super();
  }
}

// EP1-VEN-001 — Vendor status changed (e.g. active -> paused/blocked)
export class VendorStatusChangedEvent extends DomainEvent {
  readonly eventName = 'VendorStatusChanged';

  constructor(
    readonly tenantId: string,
    readonly vendor: VendorRecord,
    readonly fromStatus: VendorRecord['status'],
  ) {
    super();
  }
}

// EP1-VEN-006 — Vendor-level issue/feedback note added
export class VendorIssueNoteAddedEvent extends DomainEvent {
  readonly eventName = 'VendorIssueNoteAdded';

  constructor(
    readonly tenantId: string,
    readonly issueNote: VendorIssueNoteRecord,
  ) {
    super();
  }
}

// EP1-VEN-002 — Vendor procurement header created for a booking
export class VendorProcurementCreatedEvent extends DomainEvent {
  readonly eventName = 'VendorProcurementCreated';

  constructor(
    readonly tenantId: string,
    readonly procurement: VendorProcurementRecord,
  ) {
    super();
  }
}

// EP1-VEN-002 — Procurement line planned under a procurement header
export class ProcurementLinePlannedEvent extends DomainEvent {
  readonly eventName = 'ProcurementLinePlanned';

  constructor(
    readonly tenantId: string,
    readonly line: ProcurementLineRecord,
  ) {
    super();
  }
}

// EP1-VEN-003, EP1-VEN-005 — Procurement line state transitioned (Requested/Confirmed/Delivered/Completed)
export class ProcurementLineStatusChangedEvent extends DomainEvent {
  readonly eventName = 'ProcurementLineStatusChanged';

  constructor(
    readonly tenantId: string,
    readonly line: ProcurementLineRecord,
    readonly fromStatus: ProcurementLineRecord['status'],
  ) {
    super();
  }
}

// EP1-VEN-006 — Procurement-line-level issue note added
export class ProcurementLineIssueNoteAddedEvent extends DomainEvent {
  readonly eventName = 'ProcurementLineIssueNoteAdded';

  constructor(
    readonly tenantId: string,
    readonly issueNote: ProcurementLineIssueNoteRecord,
  ) {
    super();
  }
}
