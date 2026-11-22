import { Injectable } from '@nestjs/common';
import type { Reminder } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateReminderData,
  ReminderRecord,
  ReminderRepository,
  UpdateReminderData,
} from '../../domain/repositories/reminder.repository';

@Injectable()
export class ReminderRepositoryImpl
  extends TenantScopedRepository
  implements ReminderRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateReminderData,
  ): Promise<ReminderRecord> {
    const row = await this.prisma.reminder.create({
      data: {
        tenant: { connect: { id: tenantId } },
        category: data.category ?? 'other',
        title: data.title,
        notes: data.notes ?? null,
        dueAt: data.dueAt,
        ...(data.bookingId
          ? { booking: { connect: { id: data.bookingId } } }
          : {}),
        ...(data.customerId
          ? { customer: { connect: { id: data.customerId } } }
          : {}),
        ...(data.vendorId
          ? { vendor: { connect: { id: data.vendorId } } }
          : {}),
        ...(data.staffMemberId
          ? { staffMember: { connect: { id: data.staffMemberId } } }
          : {}),
        ...(data.communicationRecordId
          ? {
              communicationRecord: {
                connect: { id: data.communicationRecordId },
              },
            }
          : {}),
        ...(data.assignedToUserId
          ? { assignedTo: { connect: { id: data.assignedToUserId } } }
          : {}),
      },
    });
    return this.map(row);
  }

  async findById(tenantId: string, id: string): Promise<ReminderRecord | null> {
    const row = await this.prisma.reminder.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findAll(tenantId: string): Promise<ReminderRecord[]> {
    const rows = await this.prisma.reminder.findMany({
      where: { tenantId },
      orderBy: { dueAt: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<ReminderRecord[]> {
    const rows = await this.prisma.reminder.findMany({
      where: { tenantId, bookingId },
      orderBy: { dueAt: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<ReminderRecord[]> {
    const rows = await this.prisma.reminder.findMany({
      where: { tenantId, customerId },
      orderBy: { dueAt: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateReminderData,
    version: number,
  ): Promise<ReminderRecord> {
    try {
      const row = await this.prisma.reminder.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          completedAt: data.completedAt,
          cancelledAt: data.cancelledAt,
          notes: data.notes,
          title: data.title,
          dueAt: data.dueAt,
          assignedToUserId: data.assignedToUserId,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('Reminder', id, error);
    }
  }

  private map(row: Reminder): ReminderRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      bookingId: row.bookingId,
      customerId: row.customerId,
      vendorId: row.vendorId,
      staffMemberId: row.staffMemberId,
      communicationRecordId: row.communicationRecordId,
      category: row.category,
      title: row.title,
      notes: row.notes,
      dueAt: row.dueAt,
      status: row.status,
      assignedToUserId: row.assignedToUserId,
      completedAt: row.completedAt,
      cancelledAt: row.cancelledAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
