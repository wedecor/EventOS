import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
} from '../../../../shared/audit';
import { buildInvoicePdf } from '../../../../shared/pdf/build-invoice-pdf';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { TenantSettingsRepository } from '../../../tenant/domain/repositories/tenant-settings.repository';
import { InvoiceLineItemRepository } from '../../domain/repositories/invoice-line-item.repository';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';

export type GeneratedInvoicePdf = {
  buffer: Buffer;
  filename: string;
  contentType: 'application/pdf';
};

@Injectable()
export class InvoicePdfApplicationService {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly lineItemRepository: InvoiceLineItemRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly eventRepository: EventRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly tenantSettingsRepository: TenantSettingsRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async generatePdf(
    tenantId: string,
    invoiceId: string,
    actorId?: string,
  ): Promise<Result<GeneratedInvoicePdf>> {
    const invoice = await this.invoiceRepository.findById(tenantId, invoiceId);
    if (!invoice) {
      return failure('NOT_FOUND', 'Invoice not found.');
    }

    const [customer, booking, lineItems, settings, bookingPayments] =
      await Promise.all([
        this.customerRepository.findById(tenantId, invoice.customerId),
        this.eventRepository.findById(tenantId, invoice.bookingId),
        this.lineItemRepository.findByInvoiceId(tenantId, invoiceId),
        this.tenantSettingsRepository.findByTenantId(tenantId),
        this.paymentRepository.findByBookingId(tenantId, invoice.bookingId),
      ]);

    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found for invoice.');
    }

    // Prefer payments explicitly linked to this invoice; otherwise booking-scoped.
    const relevantPayments = bookingPayments.filter(
      (payment) =>
        payment.status === 'confirmed' &&
        (payment.invoiceId === invoiceId || payment.invoiceId == null),
    );
    const paidAmount = relevantPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    const outstandingAmount = Math.max(
      0,
      Number(invoice.totalAmount) - paidAmount,
    );
    const sorted = [...lineItems].sort((a, b) => a.sortOrder - b.sortOrder);

    const pdf = await buildInvoicePdf({
      businessName: settings?.businessName?.trim() || 'We Decor Events',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt,
      status: invoice.status,
      customerName: customer.displayName,
      customerEmail: customer.primaryEmail,
      customerPhone: customer.primaryPhone,
      bookingNumber: booking?.bookingNumber ?? null,
      eventType: booking?.eventType ?? null,
      venueName: booking?.venueName ?? null,
      notes: invoice.notes,
      subtotalAmount: invoice.subtotalAmount,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      paidAmount,
      outstandingAmount,
      lineItems: sorted.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPriceAmount: line.unitPriceAmount,
      })),
    });

    if (actorId) {
      await this.auditLog.record({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.INVOICE_PDF_GENERATED,
        entityType: AUDIT_ENTITY_TYPES.INVOICE,
        entityId: invoiceId,
        outcome: 'success',
        metadata: { invoiceNumber: invoice.invoiceNumber },
      });
    }

    return success({
      buffer: pdf.buffer,
      filename: pdf.filename,
      contentType: 'application/pdf',
    });
  }
}
