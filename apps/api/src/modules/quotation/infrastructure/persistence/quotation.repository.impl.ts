import { Injectable } from '@nestjs/common';
import type { Prisma, Quotation } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateQuotationData,
  QuotationRecord,
  QuotationRepository,
  UpdateQuotationData,
} from '../../domain/repositories/quotation.repository';

@Injectable()
export class QuotationRepositoryImpl
  extends TenantScopedRepository
  implements QuotationRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateQuotationData,
  ): Promise<QuotationRecord> {
    const quotation = await this.prisma.quotation.create({
      data: this.toCreateInput(tenantId, data),
    });

    return this.mapQuotation(quotation);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationRecord | null> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, tenantId },
    });

    return quotation ? this.mapQuotation(quotation) : null;
  }

  async findLatestRevision(
    tenantId: string,
    quotationNumber: number,
  ): Promise<QuotationRecord | null> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { tenantId, quotationNumber },
      orderBy: { revisionNumber: 'desc' },
    });

    return quotation ? this.mapQuotation(quotation) : null;
  }

  async findMaxQuotationNumber(tenantId: string): Promise<number> {
    const result = await this.prisma.quotation.aggregate({
      where: { tenantId },
      _max: { quotationNumber: true },
    });

    return result._max.quotationNumber ?? 0;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateQuotationData,
    version: number,
  ): Promise<QuotationRecord> {
    try {
      const quotation = await this.prisma.quotation.update({
        where: { id, tenantId, version },
        data: {
          ...this.toUpdateInput(data),
          version: { increment: 1 },
        },
      });

      return this.mapQuotation(quotation);
    } catch (error: unknown) {
      return this.toConcurrentModification('Quotation', id, error);
    }
  }

  private toCreateInput(
    tenantId: string,
    data: CreateQuotationData,
  ): Prisma.QuotationCreateInput {
    return {
      tenant: { connect: { id: tenantId } },
      customer: { connect: { id: data.customerId } },
      lead: data.leadId ? { connect: { id: data.leadId } } : undefined,
      quotationNumber: data.quotationNumber,
      revisionNumber: data.revisionNumber ?? 1,
      status: data.status ?? 'draft',
      eventType: data.eventType ?? null,
      eventStartDate: data.eventStartDate ?? null,
      eventEndDate: data.eventEndDate ?? null,
      venue: data.venue ?? null,
      validUntil: data.validUntil ?? null,
      terms: data.terms ?? null,
      notes: data.notes ?? null,
      subtotalAmount: data.subtotalAmount ?? 0,
      discountAmount: data.discountAmount ?? 0,
      taxAmount: data.taxAmount ?? 0,
      totalAmount: data.totalAmount ?? 0,
      currency: data.currency ?? 'INR',
    };
  }

  private toUpdateInput(
    data: UpdateQuotationData,
  ): Prisma.QuotationUpdateInput {
    return {
      lead:
        data.leadId === undefined
          ? undefined
          : data.leadId === null
            ? { disconnect: true }
            : { connect: { id: data.leadId } },
      status: data.status,
      eventType: data.eventType,
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      venue: data.venue,
      validUntil: data.validUntil,
      terms: data.terms,
      notes: data.notes,
      subtotalAmount: data.subtotalAmount,
      discountAmount: data.discountAmount,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      superseded:
        data.supersededById === undefined
          ? undefined
          : data.supersededById === null
            ? { disconnect: true }
            : { connect: { id: data.supersededById } },
    };
  }

  private mapQuotation(quotation: Quotation): QuotationRecord {
    return {
      id: quotation.id,
      tenantId: quotation.tenantId,
      customerId: quotation.customerId,
      leadId: quotation.leadId,
      quotationNumber: quotation.quotationNumber,
      revisionNumber: quotation.revisionNumber,
      status: quotation.status,
      eventType: quotation.eventType,
      eventStartDate: quotation.eventStartDate,
      eventEndDate: quotation.eventEndDate,
      venue: quotation.venue,
      validUntil: quotation.validUntil,
      terms: quotation.terms,
      notes: quotation.notes,
      subtotalAmount: this.toNumber(quotation.subtotalAmount) ?? 0,
      discountAmount: this.toNumber(quotation.discountAmount) ?? 0,
      taxAmount: this.toNumber(quotation.taxAmount) ?? 0,
      totalAmount: this.toNumber(quotation.totalAmount) ?? 0,
      currency: quotation.currency,
      supersededById: quotation.supersededById,
      createdAt: quotation.createdAt,
      updatedAt: quotation.updatedAt,
      version: quotation.version,
    };
  }
}
