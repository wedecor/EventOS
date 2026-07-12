import { DomainEvent } from './domain-event.base';
import type { PaymentRecord } from '../../modules/payment/domain/repositories/payment.repository';
import type { InvoiceRecord } from '../../modules/finance/domain/repositories/invoice.repository';
import type { VendorExpenseRecord } from '../../modules/finance/domain/repositories/vendor-expense.repository';

// EP1-FIN-003 — Payment voided (lifecycle extension; `PaymentRecordedEvent` is defined in
// `sprint1-domain.events.ts` where the aggregate was first introduced).
export class PaymentVoidedEvent extends DomainEvent {
  readonly eventName = 'PaymentVoided';

  constructor(
    readonly tenantId: string,
    readonly payment: PaymentRecord,
  ) {
    super();
  }
}

// EP1-FIN-002 — Invoice created (draft) for a booking
export class InvoiceCreatedEvent extends DomainEvent {
  readonly eventName = 'InvoiceCreated';

  constructor(
    readonly tenantId: string,
    readonly invoice: InvoiceRecord,
  ) {
    super();
  }
}

// EP1-FIN-002 — Invoice sent to the customer
export class InvoiceSentEvent extends DomainEvent {
  readonly eventName = 'InvoiceSent';

  constructor(
    readonly tenantId: string,
    readonly invoice: InvoiceRecord,
  ) {
    super();
  }
}

// EP1-FIN-002 — Invoice voided
export class InvoiceVoidedEvent extends DomainEvent {
  readonly eventName = 'InvoiceVoided';

  constructor(
    readonly tenantId: string,
    readonly invoice: InvoiceRecord,
  ) {
    super();
  }
}

// EP1-FIN-004 — Vendor expense recorded for a booking
export class ExpenseRecordedEvent extends DomainEvent {
  readonly eventName = 'ExpenseRecorded';

  constructor(
    readonly tenantId: string,
    readonly expense: VendorExpenseRecord,
  ) {
    super();
  }
}

// EP1-FIN-004 — Vendor expense voided
export class ExpenseVoidedEvent extends DomainEvent {
  readonly eventName = 'ExpenseVoided';

  constructor(
    readonly tenantId: string,
    readonly expense: VendorExpenseRecord,
  ) {
    super();
  }
}
