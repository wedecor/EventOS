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
import { buildQuotationPdf } from '../../../../shared/pdf/build-quotation-pdf';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { TenantSettingsRepository } from '../../../tenant/domain/repositories/tenant-settings.repository';
import { QuotationLineItemRepository } from '../../domain/repositories/quotation-line-item.repository';
import { QuotationRepository } from '../../domain/repositories/quotation.repository';

export type GeneratedPdf = {
  buffer: Buffer;
  filename: string;
  contentType: 'application/pdf';
};

@Injectable()
export class QuotationPdfApplicationService {
  constructor(
    private readonly quotationRepository: QuotationRepository,
    private readonly lineItemRepository: QuotationLineItemRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly tenantSettingsRepository: TenantSettingsRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  async generatePdf(
    tenantId: string,
    quotationId: string,
    actorId?: string,
  ): Promise<Result<GeneratedPdf>> {
    const quotation = await this.quotationRepository.findById(
      tenantId,
      quotationId,
    );
    if (!quotation) {
      return failure('NOT_FOUND', 'Quotation not found.');
    }

    const customer = await this.customerRepository.findById(
      tenantId,
      quotation.customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found for quotation.');
    }

    const [lineItems, settings] = await Promise.all([
      this.lineItemRepository.findByQuotationId(tenantId, quotationId),
      this.tenantSettingsRepository.findByTenantId(tenantId),
    ]);

    const sorted = [...lineItems].sort((a, b) => a.sortOrder - b.sortOrder);
    const pdf = await buildQuotationPdf({
      businessName: settings?.businessName?.trim() || 'We Decor Events',
      quotationNumber: quotation.quotationNumber,
      revisionNumber: quotation.revisionNumber,
      issueDate: quotation.createdAt,
      validUntil: quotation.validUntil,
      status: quotation.status,
      customerName: customer.displayName,
      customerEmail: customer.primaryEmail,
      customerPhone: customer.primaryPhone,
      eventType: quotation.eventType,
      eventStartDate: quotation.eventStartDate,
      eventEndDate: quotation.eventEndDate,
      venue: quotation.venue,
      notes: quotation.notes,
      terms: quotation.terms,
      subtotalAmount: quotation.subtotalAmount,
      discountAmount: quotation.discountAmount,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      currency: quotation.currency,
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
        action: AUDIT_ACTIONS.QUOTATION_PDF_GENERATED,
        entityType: AUDIT_ENTITY_TYPES.QUOTATION,
        entityId: quotationId,
        outcome: 'success',
        metadata: {
          quotationNumber: quotation.quotationNumber,
          revisionNumber: quotation.revisionNumber,
        },
      });
    }

    return success({
      buffer: pdf.buffer,
      filename: pdf.filename,
      contentType: 'application/pdf',
    });
  }
}
