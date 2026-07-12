import { Injectable } from '@nestjs/common';
import type { VendorExpense } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateVendorExpenseData,
  UpdateVendorExpenseData,
  VendorExpenseRecord,
  VendorExpenseRepository,
} from '../../domain/repositories/vendor-expense.repository';

@Injectable()
export class VendorExpenseRepositoryImpl
  extends TenantScopedRepository
  implements VendorExpenseRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateVendorExpenseData,
  ): Promise<VendorExpenseRecord> {
    const expense = await this.prisma.vendorExpense.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        vendor: { connect: { id: data.vendorId } },
        procurementLine: data.procurementLineId
          ? { connect: { id: data.procurementLineId } }
          : undefined,
        amount: data.amount,
        currency: data.currency ?? 'INR',
        method: data.method as never,
        paidAt: data.paidAt,
        attachmentId: data.attachmentId ?? null,
        notes: data.notes ?? null,
      },
    });

    return this.mapExpense(expense);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<VendorExpenseRecord | null> {
    const expense = await this.prisma.vendorExpense.findFirst({
      where: { id, tenantId },
    });

    return expense ? this.mapExpense(expense) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<VendorExpenseRecord[]> {
    const expenses = await this.prisma.vendorExpense.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return expenses.map((expense) => this.mapExpense(expense));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateVendorExpenseData,
    version: number,
  ): Promise<VendorExpenseRecord> {
    try {
      const expense = await this.prisma.vendorExpense.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          version: { increment: 1 },
        },
      });

      return this.mapExpense(expense);
    } catch (error: unknown) {
      return this.toConcurrentModification('VendorExpense', id, error);
    }
  }

  private mapExpense(expense: VendorExpense): VendorExpenseRecord {
    return {
      id: expense.id,
      tenantId: expense.tenantId,
      bookingId: expense.bookingId,
      vendorId: expense.vendorId,
      procurementLineId: expense.procurementLineId,
      amount: this.toNumber(expense.amount) ?? 0,
      currency: expense.currency,
      method: expense.method,
      status: expense.status,
      paidAt: expense.paidAt,
      attachmentId: expense.attachmentId,
      notes: expense.notes,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      version: expense.version,
    };
  }
}
