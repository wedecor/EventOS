import { Injectable } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreatePaymentData,
  PaymentRecord,
  PaymentRepository,
  UpdatePaymentData,
} from '../../domain/repositories/payment.repository';

@Injectable()
export class PaymentRepositoryImpl
  extends TenantScopedRepository
  implements PaymentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreatePaymentData,
  ): Promise<PaymentRecord> {
    const payment = await this.prisma.payment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: data.bookingId
          ? { connect: { id: data.bookingId } }
          : undefined,
        leadId: data.leadId ?? null,
        quotationId: data.quotationId ?? null,
        invoice: data.invoiceId
          ? { connect: { id: data.invoiceId } }
          : undefined,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        method: data.method as never,
        receivedAt: data.receivedAt,
        attachmentId: data.attachmentId ?? null,
        missingProofReason: data.missingProofReason ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.mapPayment(payment);
  }

  async findById(tenantId: string, id: string): Promise<PaymentRecord | null> {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
    });

    return payment ? this.mapPayment(payment) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<PaymentRecord[]> {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => this.mapPayment(payment));
  }

  async findAll(tenantId: string): Promise<PaymentRecord[]> {
    const payments = await this.prisma.payment.findMany({
      where: { tenantId },
      orderBy: { receivedAt: 'desc' },
    });

    return payments.map((payment) => this.mapPayment(payment));
  }

  async hasConfirmedAdvanceForLead(
    tenantId: string,
    leadId: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: {
        tenantId,
        leadId,
        status: 'confirmed',
        amount: { gt: 0 },
      },
    });

    return count > 0;
  }

  async hasConfirmedAdvanceForQuotation(
    tenantId: string,
    quotationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.payment.count({
      where: {
        tenantId,
        quotationId,
        status: 'confirmed',
        amount: { gt: 0 },
      },
    });

    return count > 0;
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdatePaymentData,
    version: number,
  ): Promise<PaymentRecord> {
    try {
      const payment = await this.prisma.payment.update({
        where: { id, tenantId, version },
        data: {
          status: data.status as never,
          version: { increment: 1 },
        },
      });

      return this.mapPayment(payment);
    } catch (error: unknown) {
      return this.toConcurrentModification('Payment', id, error);
    }
  }

  private mapPayment(payment: Payment): PaymentRecord {
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      bookingId: payment.bookingId,
      leadId: payment.leadId,
      quotationId: payment.quotationId,
      invoiceId: payment.invoiceId,
      amount: this.toNumber(payment.amount)!,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      receivedAt: payment.receivedAt,
      attachmentId: payment.attachmentId,
      missingProofReason: payment.missingProofReason,
      notes: payment.notes,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      version: payment.version,
    };
  }
}
