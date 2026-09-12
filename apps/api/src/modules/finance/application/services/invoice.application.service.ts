import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  InvoiceCreatedEvent,
  InvoiceSentEvent,
  InvoiceVoidedEvent,
} from '../../../../shared/events/sprint5-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import {
  InvoiceLineItemRepository,
  type CreateInvoiceLineItemData,
} from '../../domain/repositories/invoice-line-item.repository';
import {
  InvoiceRepository,
  type InvoiceRecord,
} from '../../domain/repositories/invoice.repository';
import { toInvoiceLineItemDto } from '../dtos/invoice-line-item.dto';
import { toInvoiceDto, type InvoiceDto } from '../dtos/invoice.dto';

export type CreateInvoiceLineItemInput = Omit<
  CreateInvoiceLineItemData,
  'sortOrder'
>;

export type CreateInvoiceInput = {
  bookingId: string;
  customerId: string;
  lineItems: CreateInvoiceLineItemInput[];
  notes?: string | null;
};

type InvoiceStatus = InvoiceRecord['status'];

// EP1-FIN-002 — Invoice lifecycle. `docs/09-api-design.md` §Module: Finance exposes only
// create/send/void commands in Phase 1; `partially_paid`/`paid` are not reachable via any
// documented command (see `InvoiceStatus` enum comment in `schema.prisma`).
const VOIDABLE_STATUSES = new Set<InvoiceStatus>(['draft', 'sent']);

@Injectable()
export class InvoiceApplicationService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly lineItemRepository: InvoiceLineItemRepository,
    private readonly eventRepository: EventRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // EP1-FIN-002 — Create a draft invoice for a booking with line items
  async createInvoice(
    tenantId: string,
    input: CreateInvoiceInput,
  ): Promise<Result<InvoiceDto>> {
    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const customer = await this.customerRepository.findById(
      tenantId,
      input.customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    // EP1-FIN-002 — `07-domain-model.md` §Invoice invariant: "Linked to Event and Customer".
    if (customer.id !== booking.customerId) {
      return failure(
        'VALIDATION_ERROR',
        'Invoice customer must match the booking customer.',
        { bookingId: input.bookingId, customerId: input.customerId },
      );
    }

    if (!input.lineItems || input.lineItems.length === 0) {
      return failure(
        'VALIDATION_ERROR',
        'Invoice must have at least one line item.',
      );
    }

    for (const lineItem of input.lineItems) {
      if (!lineItem.description?.trim()) {
        return failure(
          'VALIDATION_ERROR',
          'Invoice line item description is required.',
        );
      }
      if (lineItem.unitPriceAmount < 0) {
        return failure(
          'VALIDATION_ERROR',
          'Invoice line item unit price must be zero or greater.',
        );
      }
      if (lineItem.quantity !== undefined && lineItem.quantity <= 0) {
        return failure(
          'VALIDATION_ERROR',
          'Invoice line item quantity must be greater than zero.',
        );
      }
    }

    const subtotalAmount = input.lineItems.reduce(
      (sum, lineItem) =>
        sum + (lineItem.quantity ?? 1) * lineItem.unitPriceAmount,
      0,
    );

    const maxInvoiceNumber =
      await this.invoiceRepository.findMaxInvoiceNumber(tenantId);

    const invoice = await this.invoiceRepository.create(tenantId, {
      bookingId: input.bookingId,
      customerId: input.customerId,
      invoiceNumber: maxInvoiceNumber + 1,
      subtotalAmount,
      taxAmount: 0,
      totalAmount: subtotalAmount,
      notes: input.notes,
    });

    const lineItems = await Promise.all(
      input.lineItems.map((lineItem, index) =>
        this.lineItemRepository.create(tenantId, invoice.id, {
          ...lineItem,
          sortOrder: index,
        }),
      ),
    );

    this.eventPublisher.publish(new InvoiceCreatedEvent(tenantId, invoice));

    return success(toInvoiceDto(invoice, lineItems.map(toInvoiceLineItemDto)));
  }

  // EP1-FIN-002 — Event Workspace / financial-review integration: invoices for a booking
  async listInvoicesForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<InvoiceDto[]>> {
    const invoices = await this.invoiceRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    const dtos = await Promise.all(
      invoices.map(async (invoice) => {
        const lineItems = await this.lineItemRepository.findByInvoiceId(
          tenantId,
          invoice.id,
        );
        return toInvoiceDto(invoice, lineItems.map(toInvoiceLineItemDto));
      }),
    );

    return success(dtos);
  }

  // EP1-FIN-002 — Send a draft invoice to the customer
  async sendInvoice(
    tenantId: string,
    invoiceId: string,
    version: number,
  ): Promise<Result<InvoiceDto>> {
    const existing = await this.invoiceRepository.findById(tenantId, invoiceId);
    if (!existing) {
      return failure('NOT_FOUND', 'Invoice not found.');
    }

    if (existing.status !== 'draft') {
      return failure('INVALID_STATE', 'Only draft invoices can be sent.', {
        status: existing.status,
      });
    }

    if (existing.totalAmount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Invoice total must be greater than zero before sending.',
      );
    }

    try {
      const invoice = await this.invoiceRepository.update(
        tenantId,
        invoiceId,
        { status: 'sent', sentAt: new Date() },
        version,
      );

      this.eventPublisher.publish(new InvoiceSentEvent(tenantId, invoice));

      return success(await this.toDtoWithLineItems(tenantId, invoice));
    } catch (error: unknown) {
      return this.handleConcurrency(error, invoiceId);
    }
  }

  // EP1-FIN-002 — Void an invoice; `07-domain-model.md` §Invoice: "Void invoices cannot receive
  // payments"
  async voidInvoice(
    tenantId: string,
    invoiceId: string,
    version: number,
  ): Promise<Result<InvoiceDto>> {
    const existing = await this.invoiceRepository.findById(tenantId, invoiceId);
    if (!existing) {
      return failure('NOT_FOUND', 'Invoice not found.');
    }

    if (!VOIDABLE_STATUSES.has(existing.status)) {
      return failure(
        'INVALID_STATE',
        `Cannot void an invoice in status '${existing.status}'.`,
        { status: existing.status },
      );
    }

    try {
      const invoice = await this.invoiceRepository.update(
        tenantId,
        invoiceId,
        { status: 'void', voidedAt: new Date() },
        version,
      );

      this.eventPublisher.publish(new InvoiceVoidedEvent(tenantId, invoice));

      return success(await this.toDtoWithLineItems(tenantId, invoice));
    } catch (error: unknown) {
      return this.handleConcurrency(error, invoiceId);
    }
  }

  private async toDtoWithLineItems(
    tenantId: string,
    invoice: InvoiceRecord,
  ): Promise<InvoiceDto> {
    const lineItems = await this.lineItemRepository.findByInvoiceId(
      tenantId,
      invoice.id,
    );
    return toInvoiceDto(invoice, lineItems.map(toInvoiceLineItemDto));
  }

  private handleConcurrency<T>(error: unknown, invoiceId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Invoice was modified by another request. Reload and retry.',
        { invoiceId },
      );
    }

    throw error;
  }
}
