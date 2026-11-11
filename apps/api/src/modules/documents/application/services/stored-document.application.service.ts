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
import { ConcurrentModificationError } from '../../../../shared/database';
import {
  buildStorageKey,
  DEFAULT_MAX_UPLOAD_BYTES,
  validateDocumentUpload,
} from '../../../../shared/storage/document-upload.validation';
import {
  STORAGE_PORT,
  type StoragePort,
} from '../../../../shared/storage/storage.port';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import {
  StoredDocumentRepository,
  type StoredDocumentCategory,
} from '../../domain/repositories/stored-document.repository';
import {
  toStoredDocumentDto,
  type StoredDocumentDto,
} from '../dtos/stored-document.dto';

export type UploadStoredDocumentInput = {
  category: StoredDocumentCategory;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  customerId?: string;
  quotationId?: string;
  bookingId?: string;
  invoiceId?: string;
  uploadedByUserId: string;
};

export type DownloadStoredDocumentResult = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};

@Injectable()
export class StoredDocumentApplicationService {
  constructor(
    private readonly documents: StoredDocumentRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly customerRepository: CustomerRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly eventRepository: EventRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly auditLog: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  private maxUploadBytes(): number {
    const raw = this.config.get<string>('STORAGE_MAX_UPLOAD_BYTES');
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_MAX_UPLOAD_BYTES;
  }

  async upload(
    tenantId: string,
    input: UploadStoredDocumentInput,
  ): Promise<Result<StoredDocumentDto>> {
    if (
      !input.customerId &&
      !input.quotationId &&
      !input.bookingId &&
      !input.invoiceId
    ) {
      return failure(
        'VALIDATION_ERROR',
        'At least one of customerId, quotationId, bookingId, or invoiceId is required.',
      );
    }

    const validation = validateDocumentUpload({
      originalName: input.originalName,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.byteLength,
      maxBytes: this.maxUploadBytes(),
    });
    if (!validation.ok) {
      return failure(validation.code, validation.message);
    }

    const linkCheck = await this.assertLinks(tenantId, input);
    if (!linkCheck.ok) return linkCheck;

    const storageKey = buildStorageKey(tenantId, validation.extension);
    try {
      await this.storage.put({
        key: storageKey,
        body: input.buffer,
        contentType: input.mimeType,
      });
    } catch {
      return failure(
        'VALIDATION_ERROR',
        'Failed to store document. Check storage configuration.',
      );
    }

    try {
      const record = await this.documents.create(tenantId, {
        category: input.category,
        fileName: validation.safeFileName,
        mimeType: input.mimeType,
        fileSizeBytes: input.buffer.byteLength,
        storageKey,
        storageProvider: this.storage.providerName,
        customerId: input.customerId ?? null,
        quotationId: input.quotationId ?? null,
        bookingId: input.bookingId ?? null,
        invoiceId: input.invoiceId ?? null,
        uploadedByUserId: input.uploadedByUserId,
      });

      await this.auditLog.record({
        actorId: input.uploadedByUserId,
        tenantId,
        action: AUDIT_ACTIONS.DOCUMENT_UPLOADED,
        entityType: AUDIT_ENTITY_TYPES.STORED_DOCUMENT,
        entityId: record.id,
        outcome: 'success',
        metadata: {
          category: record.category,
          mimeType: record.mimeType,
          fileSizeBytes: record.fileSizeBytes,
        },
      });

      return success(toStoredDocumentDto(record));
    } catch (error) {
      await this.storage.delete(storageKey).catch(() => undefined);
      throw error;
    }
  }

  async list(
    tenantId: string,
    filter: {
      customerId?: string;
      quotationId?: string;
      bookingId?: string;
      invoiceId?: string;
    },
  ): Promise<Result<StoredDocumentDto[]>> {
    if (
      !filter.customerId &&
      !filter.quotationId &&
      !filter.bookingId &&
      !filter.invoiceId
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Provide customerId, quotationId, bookingId, or invoiceId to list documents.',
      );
    }
    const rows = await this.documents.list(tenantId, filter);
    return success(rows.map(toStoredDocumentDto));
  }

  async download(
    tenantId: string,
    id: string,
  ): Promise<Result<DownloadStoredDocumentResult>> {
    const record = await this.documents.findById(tenantId, id);
    if (!record) {
      return failure('NOT_FOUND', 'Document not found.');
    }
    try {
      const object = await this.storage.get(record.storageKey);
      return success({
        buffer: object.body,
        fileName: record.fileName,
        mimeType: record.mimeType,
      });
    } catch {
      return failure('NOT_FOUND', 'Document file is unavailable in storage.');
    }
  }

  async delete(
    tenantId: string,
    id: string,
    version: number,
    actorId: string,
  ): Promise<Result<{ id: string }>> {
    const existing = await this.documents.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Document not found.');
    }

    try {
      const deleted = await this.documents.softDelete(tenantId, id, version);
      try {
        await this.storage.delete(existing.storageKey);
      } catch {
        // Metadata is soft-deleted; blob cleanup best-effort (avoid blocking UX).
      }
      await this.auditLog.record({
        actorId,
        tenantId,
        action: AUDIT_ACTIONS.DOCUMENT_DELETED,
        entityType: AUDIT_ENTITY_TYPES.STORED_DOCUMENT,
        entityId: deleted.id,
        outcome: 'success',
        metadata: { category: existing.category },
      });
      return success({ id: deleted.id });
    } catch (error) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Document was modified by another request. Reload and retry.',
        );
      }
      throw error;
    }
  }

  private async assertLinks(
    tenantId: string,
    input: UploadStoredDocumentInput,
  ): Promise<Result<true>> {
    if (input.customerId) {
      const customer = await this.customerRepository.findById(
        tenantId,
        input.customerId,
      );
      if (!customer) return failure('NOT_FOUND', 'Customer not found.');
    }
    if (input.quotationId) {
      const quotation = await this.quotationRepository.findById(
        tenantId,
        input.quotationId,
      );
      if (!quotation) return failure('NOT_FOUND', 'Quotation not found.');
    }
    if (input.bookingId) {
      const booking = await this.eventRepository.findById(
        tenantId,
        input.bookingId,
      );
      if (!booking) return failure('NOT_FOUND', 'Booking not found.');
    }
    if (input.invoiceId) {
      const invoice = await this.invoiceRepository.findById(
        tenantId,
        input.invoiceId,
      );
      if (!invoice) return failure('NOT_FOUND', 'Invoice not found.');
    }
    return success(true);
  }
}
