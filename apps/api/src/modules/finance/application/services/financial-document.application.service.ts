import { Injectable } from '@nestjs/common';
import type { FinancialDocumentType } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { VendorExpenseRepository } from '../../domain/repositories/vendor-expense.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';
import { FinancialDocumentRepository } from '../../domain/repositories/financial-document.repository';
import { FinancialDocumentAuditEventRepository } from '../../domain/repositories/financial-document-audit-event.repository';
import {
  toFinancialDocumentAuditEventDto,
  toFinancialDocumentDto,
  type FinancialDocumentAuditEventDto,
  type FinancialDocumentDto,
} from '../dtos/financial-document.dto';

export type CreateFinancialDocumentInput = {
  bookingId: string;
  documentType: FinancialDocumentType;
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
  paymentId?: string | null;
  vendorExpenseId?: string | null;
  vendorProcurementId?: string | null;
  invoiceId?: string | null;
  uploadedByUserId?: string | null;
};

export type UpdateFinancialDocumentInput = {
  description?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  storageKey?: string | null;
  paymentId?: string | null;
  vendorExpenseId?: string | null;
  vendorProcurementId?: string | null;
  invoiceId?: string | null;
};

export type VerifyFinancialDocumentInput = {
  verificationNotes?: string | null;
  verifiedByUserId: string;
};

@Injectable()
export class FinancialDocumentApplicationService {
  constructor(
    private readonly documentRepository: FinancialDocumentRepository,
    private readonly auditEventRepository: FinancialDocumentAuditEventRepository,
    private readonly eventRepository: EventRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly expenseRepository: VendorExpenseRepository,
    private readonly procurementRepository: VendorProcurementRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async createDocument(
    tenantId: string,
    input: CreateFinancialDocumentInput,
  ): Promise<Result<FinancialDocumentDto>> {
    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const linkError = await this.validateLinks(tenantId, input);
    if (linkError) return linkError;

    const document = await this.documentRepository.create(tenantId, {
      bookingId: input.bookingId,
      documentType: input.documentType,
      description: input.description,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      storageKey: input.storageKey,
      paymentId: input.paymentId,
      vendorExpenseId: input.vendorExpenseId,
      vendorProcurementId: input.vendorProcurementId,
      invoiceId: input.invoiceId,
      uploadedByUserId: input.uploadedByUserId,
    });

    await this.auditEventRepository.create(tenantId, {
      financialDocumentId: document.id,
      eventType: 'uploaded',
      message: `Financial document uploaded (${document.documentType})`,
      actorUserId: input.uploadedByUserId,
    });

    return success(toFinancialDocumentDto(document));
  }

  async getById(
    tenantId: string,
    id: string,
  ): Promise<Result<FinancialDocumentDto>> {
    const document = await this.documentRepository.findById(tenantId, id);
    if (!document || document.deletedAt) {
      return failure('NOT_FOUND', 'Financial document not found.');
    }
    return success(toFinancialDocumentDto(document));
  }

  async listForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<FinancialDocumentDto[]>> {
    const rows = await this.documentRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toFinancialDocumentDto));
  }

  async listForPayment(
    tenantId: string,
    paymentId: string,
  ): Promise<Result<FinancialDocumentDto[]>> {
    const payment = await this.paymentRepository.findById(tenantId, paymentId);
    if (!payment) {
      return failure('NOT_FOUND', 'Payment not found.');
    }
    const rows = await this.documentRepository.findByPaymentId(
      tenantId,
      paymentId,
    );
    return success(rows.map(toFinancialDocumentDto));
  }

  async listForExpense(
    tenantId: string,
    expenseId: string,
  ): Promise<Result<FinancialDocumentDto[]>> {
    const expense = await this.expenseRepository.findById(tenantId, expenseId);
    if (!expense) {
      return failure('NOT_FOUND', 'Expense not found.');
    }
    const rows = await this.documentRepository.findByExpenseId(
      tenantId,
      expenseId,
    );
    return success(rows.map(toFinancialDocumentDto));
  }

  async updateDocument(
    tenantId: string,
    id: string,
    input: UpdateFinancialDocumentInput,
    version: number,
    actorUserId?: string | null,
  ): Promise<Result<FinancialDocumentDto>> {
    const existing = await this.documentRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Financial document not found.');
    }

    const linkError = await this.validateLinks(tenantId, {
      bookingId: existing.bookingId,
      documentType: existing.documentType,
      ...input,
    });
    if (linkError) return linkError;

    try {
      const updated = await this.documentRepository.update(
        tenantId,
        id,
        {
          description: input.description,
          fileName: input.fileName,
          mimeType: input.mimeType,
          fileSizeBytes: input.fileSizeBytes,
          storageKey: input.storageKey,
          paymentId: input.paymentId,
          vendorExpenseId: input.vendorExpenseId,
          vendorProcurementId: input.vendorProcurementId,
          invoiceId: input.invoiceId,
        },
        version,
      );

      await this.auditEventRepository.create(tenantId, {
        financialDocumentId: id,
        eventType: 'updated',
        message: 'Financial document metadata updated',
        actorUserId: actorUserId ?? null,
      });

      return success(toFinancialDocumentDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async verifyDocument(
    tenantId: string,
    id: string,
    input: VerifyFinancialDocumentInput,
    version: number,
  ): Promise<Result<FinancialDocumentDto>> {
    return this.setVerification(
      tenantId,
      id,
      version,
      'verified',
      input.verifiedByUserId,
      input.verificationNotes,
    );
  }

  async rejectDocument(
    tenantId: string,
    id: string,
    input: VerifyFinancialDocumentInput,
    version: number,
  ): Promise<Result<FinancialDocumentDto>> {
    return this.setVerification(
      tenantId,
      id,
      version,
      'rejected',
      input.verifiedByUserId,
      input.verificationNotes,
    );
  }

  async softDeleteDocument(
    tenantId: string,
    id: string,
    version: number,
    actorUserId?: string | null,
  ): Promise<Result<FinancialDocumentDto>> {
    const existing = await this.documentRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Financial document not found.');
    }

    try {
      const updated = await this.documentRepository.update(
        tenantId,
        id,
        { deletedAt: new Date() },
        version,
      );

      await this.auditEventRepository.create(tenantId, {
        financialDocumentId: id,
        eventType: 'deleted',
        message: 'Financial document soft-deleted',
        actorUserId: actorUserId ?? null,
      });

      return success(toFinancialDocumentDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async listAuditEvents(
    tenantId: string,
    documentId: string,
  ): Promise<Result<FinancialDocumentAuditEventDto[]>> {
    const document = await this.documentRepository.findById(
      tenantId,
      documentId,
    );
    if (!document) {
      return failure('NOT_FOUND', 'Financial document not found.');
    }
    const rows = await this.auditEventRepository.findByDocumentId(
      tenantId,
      documentId,
    );
    return success(rows.map(toFinancialDocumentAuditEventDto));
  }

  private async setVerification(
    tenantId: string,
    id: string,
    version: number,
    status: 'verified' | 'rejected',
    verifiedByUserId: string,
    verificationNotes?: string | null,
  ): Promise<Result<FinancialDocumentDto>> {
    const existing = await this.documentRepository.findById(tenantId, id);
    if (!existing || existing.deletedAt) {
      return failure('NOT_FOUND', 'Financial document not found.');
    }
    if (existing.verificationStatus !== 'pending') {
      return failure(
        'INVALID_STATE',
        `Cannot ${status === 'verified' ? 'verify' : 'reject'} a document that is already ${existing.verificationStatus}.`,
        { status: existing.verificationStatus },
      );
    }

    try {
      const updated = await this.documentRepository.update(
        tenantId,
        id,
        {
          verificationStatus: status,
          verifiedByUserId,
          verifiedAt: new Date(),
          verificationNotes: verificationNotes ?? null,
        },
        version,
      );

      await this.auditEventRepository.create(tenantId, {
        financialDocumentId: id,
        eventType: status,
        message:
          status === 'verified'
            ? 'Financial document verified'
            : 'Financial document rejected',
        actorUserId: verifiedByUserId,
      });

      return success(toFinancialDocumentDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  private async validateLinks(
    tenantId: string,
    input: {
      bookingId: string;
      documentType: FinancialDocumentType;
      paymentId?: string | null;
      vendorExpenseId?: string | null;
      vendorProcurementId?: string | null;
      invoiceId?: string | null;
    },
  ): Promise<Result<FinancialDocumentDto> | null> {
    if (input.paymentId) {
      const payment = await this.paymentRepository.findById(
        tenantId,
        input.paymentId,
      );
      if (!payment) {
        return failure('NOT_FOUND', 'Payment not found.');
      }
      if (payment.bookingId && payment.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Payment must belong to the same booking.',
        );
      }
    }

    if (input.vendorExpenseId) {
      const expense = await this.expenseRepository.findById(
        tenantId,
        input.vendorExpenseId,
      );
      if (!expense) {
        return failure('NOT_FOUND', 'Expense not found.');
      }
      if (expense.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Expense must belong to the same booking.',
        );
      }
    }

    if (input.vendorProcurementId) {
      const procurement = await this.procurementRepository.findById(
        tenantId,
        input.vendorProcurementId,
      );
      if (!procurement) {
        return failure('NOT_FOUND', 'Vendor procurement not found.');
      }
      if (procurement.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Procurement must belong to the same booking.',
        );
      }
    }

    if (input.invoiceId) {
      const invoice = await this.invoiceRepository.findById(
        tenantId,
        input.invoiceId,
      );
      if (!invoice) {
        return failure('NOT_FOUND', 'Invoice not found.');
      }
      if (invoice.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Invoice must belong to the same booking.',
        );
      }
    }

    return null;
  }

  private handleConcurrency<T>(error: unknown, documentId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Financial document was modified by another request. Reload and retry.',
        { documentId },
      );
    }
    throw error;
  }
}
