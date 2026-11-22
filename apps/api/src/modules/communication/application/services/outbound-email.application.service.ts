import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { MAIL_PORT, type MailPort } from '../../../../shared/mail/mail.port';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { InvoicePdfApplicationService } from '../../../finance/application/services/invoice-pdf.application.service';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { QuotationPdfApplicationService } from '../../../quotation/application/services/quotation-pdf.application.service';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import { TenantSettingsRepository } from '../../../tenant/domain/repositories/tenant-settings.repository';
import { CommunicationRecordRepository } from '../../domain/repositories/communication-record.repository';

export type SendDocumentEmailResult = {
  communicationId: string;
  status: 'sent' | 'failed';
  provider: string;
  providerMessageId: string | null;
  /** True when the provider accepted the message — not mailbox delivery proof. */
  providerAccepted: boolean;
  recipient: string;
};

@Injectable()
export class OutboundEmailApplicationService {
  private readonly recentSends = new Map<string, number>();

  constructor(
    private readonly quotations: QuotationRepository,
    private readonly invoices: InvoiceRepository,
    private readonly customers: CustomerRepository,
    private readonly tenantSettings: TenantSettingsRepository,
    private readonly communicationRecords: CommunicationRecordRepository,
    private readonly quotationPdf: QuotationPdfApplicationService,
    private readonly invoicePdf: InvoicePdfApplicationService,
    @Inject(MAIL_PORT) private readonly mail: MailPort,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  async sendQuotationEmail(
    tenantId: string,
    quotationId: string,
    actorId: string,
    to?: string,
  ): Promise<Result<SendDocumentEmailResult>> {
    const quotation = await this.quotations.findById(tenantId, quotationId);
    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }
    const customer = await this.customers.findById(
      tenantId,
      quotation.customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const recipient = (to ?? customer.primaryEmail ?? '').trim();
    if (!recipient) {
      return failure(
        'VALIDATION_ERROR',
        'Recipient email is required (customer has no primary email).',
      );
    }

    const dup = this.guardDuplicate(`quotation:${quotationId}:${recipient}`);
    if (!dup.ok) return dup;

    const pdf = await this.quotationPdf.generatePdf(
      tenantId,
      quotationId,
      actorId,
    );
    if (!pdf.ok) return pdf;

    const settings = await this.tenantSettings.findByTenantId(tenantId);
    const businessName = settings?.businessName?.trim() || 'We Decor Events';
    const subject = `${businessName} — Quotation Q-${quotation.quotationNumber}`;
    const text = `Please find attached quotation Q-${quotation.quotationNumber} (revision ${quotation.revisionNumber}).`;
    const html = `<p>Dear ${customer.displayName},</p><p>${text}</p><p>Regards,<br/>${businessName}</p>`;

    const sendResult = await this.mail.send({
      to: recipient,
      subject,
      text,
      html,
      fromName: this.config.get<string>('MAIL_FROM_NAME') ?? businessName,
      fromEmail: this.config.get<string>('MAIL_FROM_EMAIL') || undefined,
      attachments: [
        {
          filename: pdf.value.filename,
          content: pdf.value.buffer,
          contentType: 'application/pdf',
        },
      ],
      idempotencyKey: `quotation:${quotationId}:${recipient}`,
    });

    const now = new Date();
    const record = await this.communicationRecords.create(tenantId, {
      channel: 'email',
      direction: 'outgoing',
      status: sendResult.accepted ? 'sent' : 'failed',
      subject,
      body: text,
      customerId: customer.id,
      quotationId: quotation.id,
      recipientAddress: recipient,
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId ?? null,
      failureReason: sendResult.errorMessage
        ? sanitizeFailure(sendResult.errorMessage)
        : null,
      createdByUserId: actorId,
      occurredAt: now,
      sentAt: sendResult.accepted ? now : null,
      failedAt: sendResult.accepted ? null : now,
    });

    await this.auditLog.record({
      actorId,
      tenantId,
      action: AUDIT_ACTIONS.QUOTATION_EMAIL_QUEUED,
      entityType: AUDIT_ENTITY_TYPES.QUOTATION,
      entityId: quotationId,
      outcome: sendResult.accepted ? 'success' : 'failure',
      metadata: {
        communicationId: record.id,
        provider: sendResult.provider,
        providerAccepted: sendResult.accepted,
      },
    });

    return success({
      communicationId: record.id,
      status: sendResult.accepted ? 'sent' : 'failed',
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId ?? null,
      providerAccepted: sendResult.accepted,
      recipient,
    });
  }

  async sendInvoiceEmail(
    tenantId: string,
    invoiceId: string,
    actorId: string,
    to?: string,
  ): Promise<Result<SendDocumentEmailResult>> {
    const invoice = await this.invoices.findById(tenantId, invoiceId);
    if (!invoice) {
      return failure('NOT_FOUND', 'Invoice not found.');
    }
    const customer = await this.customers.findById(
      tenantId,
      invoice.customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const recipient = (to ?? customer.primaryEmail ?? '').trim();
    if (!recipient) {
      return failure(
        'VALIDATION_ERROR',
        'Recipient email is required (customer has no primary email).',
      );
    }

    const dup = this.guardDuplicate(`invoice:${invoiceId}:${recipient}`);
    if (!dup.ok) return dup;

    const pdf = await this.invoicePdf.generatePdf(tenantId, invoiceId, actorId);
    if (!pdf.ok) return pdf;

    const settings = await this.tenantSettings.findByTenantId(tenantId);
    const businessName = settings?.businessName?.trim() || 'We Decor Events';
    const subject = `${businessName} — Invoice INV-${invoice.invoiceNumber}`;
    const text = `Please find attached invoice INV-${invoice.invoiceNumber}.`;
    const html = `<p>Dear ${customer.displayName},</p><p>${text}</p><p>Regards,<br/>${businessName}</p>`;

    const sendResult = await this.mail.send({
      to: recipient,
      subject,
      text,
      html,
      fromName: this.config.get<string>('MAIL_FROM_NAME') ?? businessName,
      fromEmail: this.config.get<string>('MAIL_FROM_EMAIL') || undefined,
      attachments: [
        {
          filename: pdf.value.filename,
          content: pdf.value.buffer,
          contentType: 'application/pdf',
        },
      ],
      idempotencyKey: `invoice:${invoiceId}:${recipient}`,
    });

    const now = new Date();
    const record = await this.communicationRecords.create(tenantId, {
      channel: 'email',
      direction: 'outgoing',
      status: sendResult.accepted ? 'sent' : 'failed',
      subject,
      body: text,
      customerId: customer.id,
      bookingId: invoice.bookingId,
      invoiceId: invoice.id,
      recipientAddress: recipient,
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId ?? null,
      failureReason: sendResult.errorMessage
        ? sanitizeFailure(sendResult.errorMessage)
        : null,
      createdByUserId: actorId,
      occurredAt: now,
      sentAt: sendResult.accepted ? now : null,
      failedAt: sendResult.accepted ? null : now,
    });

    await this.auditLog.record({
      actorId,
      tenantId,
      action: AUDIT_ACTIONS.INVOICE_EMAIL_QUEUED,
      entityType: AUDIT_ENTITY_TYPES.INVOICE,
      entityId: invoiceId,
      outcome: sendResult.accepted ? 'success' : 'failure',
      metadata: {
        communicationId: record.id,
        provider: sendResult.provider,
        providerAccepted: sendResult.accepted,
      },
    });

    return success({
      communicationId: record.id,
      status: sendResult.accepted ? 'sent' : 'failed',
      provider: sendResult.provider,
      providerMessageId: sendResult.providerMessageId ?? null,
      providerAccepted: sendResult.accepted,
      recipient,
    });
  }

  private guardDuplicate(key: string): Result<true> {
    const windowSec =
      this.config.get<number>('MAIL_IDEMPOTENCY_WINDOW_SEC') ?? 30;
    const now = Date.now();
    const previous = this.recentSends.get(key);
    if (previous && now - previous < windowSec * 1000) {
      return failure(
        'VALIDATION_ERROR',
        `Duplicate send prevented. Wait ${windowSec}s before retrying.`,
      );
    }
    this.recentSends.set(key, now);
    return success(true);
  }
}

function sanitizeFailure(message: string): string {
  return message
    .replace(/pass(word)?[=:].*/gi, 'password=[redacted]')
    .replace(/secret[=:].*/gi, 'secret=[redacted]')
    .slice(0, 500);
}
