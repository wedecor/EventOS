import { Injectable } from '@nestjs/common';
import type { Invoice } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInvoiceData,
  InvoiceRecord,
  InvoiceRepository,
  UpdateInvoiceData,
} from '../../domain/repositories/invoice.repository';

@Injectable()
export class InvoiceRepositoryImpl
  extends TenantScopedRepository
  implements InvoiceRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateInvoiceData,
  ): Promise<InvoiceRecord> {
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        bookingId: data.bookingId,
        customerId: data.customerId,
        invoiceNumber: data.invoiceNumber,
        subtotalAmount: data.subtotalAmount,
        taxAmount: data.taxAmount ?? 0,
        totalAmount: data.totalAmount,
        currency: data.currency ?? 'INR',
        notes: data.notes ?? null,
      },
    });

    return this.mapInvoice(invoice);
  }

  async findById(tenantId: string, id: string): Promise<InvoiceRecord | null> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });

    return invoice ? this.mapInvoice(invoice) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<InvoiceRecord[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((invoice) => this.mapInvoice(invoice));
  }

  async findMaxInvoiceNumber(tenantId: string): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where: { tenantId },
      _max: { invoiceNumber: true },
    });

    return result._max.invoiceNumber ?? 0;
  }

  async findAll(tenantId: string): Promise<InvoiceRecord[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return invoices.map((invoice) => this.mapInvoice(invoice));
  }

  async hasDraftInvoiceForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<boolean> {
    const count = await this.prisma.invoice.count({
      where: { tenantId, bookingId, status: 'draft' },
    });

    return count > 0;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateInvoiceData,
    version: number,
  ): Promise<InvoiceRecord> {
    try {
      const invoice = await this.prisma.invoice.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          sentAt: data.sentAt,
          voidedAt: data.voidedAt,
          version: { increment: 1 },
        },
      });

      return this.mapInvoice(invoice);
    } catch (error: unknown) {
      return this.toConcurrentModification('Invoice', id, error);
    }
  }

  private mapInvoice(invoice: Invoice): InvoiceRecord {
    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      bookingId: invoice.bookingId,
      customerId: invoice.customerId,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      subtotalAmount: this.toNumber(invoice.subtotalAmount) ?? 0,
      taxAmount: this.toNumber(invoice.taxAmount) ?? 0,
      totalAmount: this.toNumber(invoice.totalAmount) ?? 0,
      currency: invoice.currency,
      notes: invoice.notes,
      sentAt: invoice.sentAt,
      voidedAt: invoice.voidedAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      version: invoice.version,
    };
  }
}
