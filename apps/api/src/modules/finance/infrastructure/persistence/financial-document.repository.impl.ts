import { Injectable } from '@nestjs/common';
import type { FinancialDocument } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateFinancialDocumentData,
  FinancialDocumentRecord,
  FinancialDocumentRepository,
  UpdateFinancialDocumentData,
} from '../../domain/repositories/financial-document.repository';

@Injectable()
export class FinancialDocumentRepositoryImpl
  extends TenantScopedRepository
  implements FinancialDocumentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateFinancialDocumentData,
  ): Promise<FinancialDocumentRecord> {
    const row = await this.prisma.financialDocument.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        documentType: data.documentType,
        description: data.description ?? null,
        fileName: data.fileName ?? null,
        mimeType: data.mimeType ?? null,
        fileSizeBytes: data.fileSizeBytes ?? null,
        storageKey: data.storageKey ?? null,
        uploadedAt: data.uploadedAt ?? new Date(),
        ...(data.paymentId
          ? { payment: { connect: { id: data.paymentId } } }
          : {}),
        ...(data.vendorExpenseId
          ? { vendorExpense: { connect: { id: data.vendorExpenseId } } }
          : {}),
        ...(data.vendorProcurementId
          ? {
              vendorProcurement: {
                connect: { id: data.vendorProcurementId },
              },
            }
          : {}),
        ...(data.invoiceId
          ? { invoice: { connect: { id: data.invoiceId } } }
          : {}),
        ...(data.uploadedByUserId
          ? { uploadedBy: { connect: { id: data.uploadedByUserId } } }
          : {}),
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<FinancialDocumentRecord | null> {
    const row = await this.prisma.financialDocument.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<FinancialDocumentRecord[]> {
    const rows = await this.prisma.financialDocument.findMany({
      where: {
        tenantId,
        bookingId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByPaymentId(
    tenantId: string,
    paymentId: string,
  ): Promise<FinancialDocumentRecord[]> {
    const rows = await this.prisma.financialDocument.findMany({
      where: { tenantId, paymentId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByExpenseId(
    tenantId: string,
    vendorExpenseId: string,
  ): Promise<FinancialDocumentRecord[]> {
    const rows = await this.prisma.financialDocument.findMany({
      where: { tenantId, vendorExpenseId, deletedAt: null },
      orderBy: { uploadedAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateFinancialDocumentData,
    version: number,
  ): Promise<FinancialDocumentRecord> {
    try {
      const row = await this.prisma.financialDocument.update({
        where: { id, tenantId, version },
        data: {
          description: data.description,
          fileName: data.fileName,
          mimeType: data.mimeType,
          fileSizeBytes: data.fileSizeBytes,
          storageKey: data.storageKey,
          paymentId: data.paymentId,
          vendorExpenseId: data.vendorExpenseId,
          vendorProcurementId: data.vendorProcurementId,
          invoiceId: data.invoiceId,
          verificationStatus: data.verificationStatus,
          verifiedByUserId: data.verifiedByUserId,
          verifiedAt: data.verifiedAt,
          verificationNotes: data.verificationNotes,
          deletedAt: data.deletedAt,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('FinancialDocument', id, error);
    }
  }

  private map(row: FinancialDocument): FinancialDocumentRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      bookingId: row.bookingId,
      documentType: row.documentType,
      verificationStatus: row.verificationStatus,
      description: row.description,
      fileName: row.fileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      storageKey: row.storageKey,
      paymentId: row.paymentId,
      vendorExpenseId: row.vendorExpenseId,
      vendorProcurementId: row.vendorProcurementId,
      invoiceId: row.invoiceId,
      uploadedByUserId: row.uploadedByUserId,
      uploadedAt: row.uploadedAt,
      verifiedByUserId: row.verifiedByUserId,
      verifiedAt: row.verifiedAt,
      verificationNotes: row.verificationNotes,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
