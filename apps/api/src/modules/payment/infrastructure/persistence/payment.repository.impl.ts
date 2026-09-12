import { Injectable } from '@nestjs/common';
import type { Payment } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  PaymentRepository,
  type CreatePaymentData,
  type PaymentRecord,
} from '../../domain/repositories/payment.repository';

@Injectable()
export class PaymentRepositoryImpl implements PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    data: CreatePaymentData,
  ): Promise<PaymentRecord> {
    const payment = await this.prisma.payment.create({
      data: {
        tenantId,
        eventId: data.eventId ?? null,
        leadId: data.leadId ?? null,
        quotationId: data.quotationId ?? null,
        paymentType: data.paymentType ?? 'advance',
        amount: data.amount,
        currency: data.currency ?? 'INR',
        method: data.method,
        status: 'recorded',
        receivedAt: data.receivedAt,
        missingProofReason: data.missingProofReason ?? null,
      },
    });

    return this.map(payment);
  }

  async hasConfirmedAdvance(
    tenantId: string,
    criteria: { leadId?: string; quotationId?: string; eventId?: string },
  ): Promise<boolean> {
    const orFilters = [
      criteria.leadId ? { leadId: criteria.leadId } : null,
      criteria.quotationId ? { quotationId: criteria.quotationId } : null,
      criteria.eventId ? { eventId: criteria.eventId } : null,
    ].filter(
      (
        item,
      ): item is
        { leadId: string } | { quotationId: string } | { eventId: string } =>
        item !== null,
    );

    if (orFilters.length === 0) {
      return false;
    }

    const count = await this.prisma.payment.count({
      where: {
        tenantId,
        status: 'recorded',
        paymentType: 'advance',
        OR: orFilters,
      },
    });

    return count > 0;
  }

  private map(payment: Payment): PaymentRecord {
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      eventId: payment.eventId,
      leadId: payment.leadId,
      quotationId: payment.quotationId,
      paymentType: payment.paymentType,
      amount: Number(payment.amount),
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      receivedAt: payment.receivedAt,
      missingProofReason: payment.missingProofReason,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      version: payment.version,
    };
  }
}
