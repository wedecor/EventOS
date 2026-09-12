import { DomainEvent } from './domain-event.base';
import type { LeadRecord } from '../../modules/lead/domain/repositories/lead.repository';
import type { FollowUpRecord } from '../../modules/lead/domain/repositories/follow-up.repository';
import type { CustomerRecord } from '../../modules/customer/domain/repositories/customer.repository';
import type { QuotationRecord } from '../../modules/quotation/domain/repositories/quotation.repository';
import type { EventRecord } from '../../modules/booking/domain/repositories/event.repository';
import type { PaymentRecord } from '../../modules/payment/domain/repositories/payment.repository';
import type { ContactRecord } from '../../modules/customer/domain/repositories/contact.repository';

export class LeadCreatedEvent extends DomainEvent {
  readonly eventName = 'LeadCreated';

  constructor(
    readonly tenantId: string,
    readonly lead: LeadRecord,
  ) {
    super();
  }
}

export class LeadStageChangedEvent extends DomainEvent {
  readonly eventName = 'LeadStageChanged';

  constructor(
    readonly tenantId: string,
    readonly lead: LeadRecord,
    readonly previousStage: LeadRecord['stage'],
  ) {
    super();
  }
}

export class LeadAssignedEvent extends DomainEvent {
  readonly eventName = 'LeadAssigned';

  constructor(
    readonly tenantId: string,
    readonly lead: LeadRecord,
    readonly assigneeId: string,
  ) {
    super();
  }
}

export class FollowUpCreatedEvent extends DomainEvent {
  readonly eventName = 'FollowUpCreated';

  constructor(
    readonly tenantId: string,
    readonly followUp: FollowUpRecord,
  ) {
    super();
  }
}

export class ContactAddedEvent extends DomainEvent {
  readonly eventName = 'ContactAdded';

  constructor(
    readonly tenantId: string,
    readonly contact: ContactRecord,
    readonly customerId: string,
  ) {
    super();
  }
}

export class CustomerCreatedEvent extends DomainEvent {
  readonly eventName = 'ClientCreated';

  constructor(
    readonly tenantId: string,
    readonly customer: CustomerRecord,
  ) {
    super();
  }
}

export class QuotationCreatedEvent extends DomainEvent {
  readonly eventName = 'QuotationCreated';

  constructor(
    readonly tenantId: string,
    readonly quotation: QuotationRecord,
  ) {
    super();
  }
}

export class QuotationSupersededEvent extends DomainEvent {
  readonly eventName = 'QuotationSuperseded';

  constructor(
    readonly tenantId: string,
    readonly supersededQuotation: QuotationRecord,
    readonly replacementQuotationId: string,
  ) {
    super();
  }
}

export class QuotationApprovedEvent extends DomainEvent {
  readonly eventName = 'QuotationApproved';

  constructor(
    readonly tenantId: string,
    readonly quotation: QuotationRecord,
  ) {
    super();
  }
}

export class EventCreatedEvent extends DomainEvent {
  readonly eventName = 'EventCreated';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
  ) {
    super();
  }
}

export class BookingStatusChangedEvent extends DomainEvent {
  readonly eventName = 'BookingStatusChanged';

  constructor(
    readonly tenantId: string,
    readonly event: EventRecord,
    readonly previousStatus: EventRecord['status'],
  ) {
    super();
  }
}

export class QuotationSentEvent extends DomainEvent {
  readonly eventName = 'QuotationSent';

  constructor(
    readonly tenantId: string,
    readonly quotation: QuotationRecord,
  ) {
    super();
  }
}

export class PaymentRecordedEvent extends DomainEvent {
  readonly eventName = 'PaymentRecorded';

  constructor(
    readonly tenantId: string,
    readonly payment: PaymentRecord,
  ) {
    super();
  }
}
