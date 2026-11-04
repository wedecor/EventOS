import { Injectable } from '@nestjs/common';
import type { CommunicationRecord } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CommunicationRecordRecord,
  CommunicationRecordRepository,
  CreateCommunicationRecordData,
  UpdateCommunicationRecordData,
} from '../../domain/repositories/communication-record.repository';

@Injectable()
export class CommunicationRecordRepositoryImpl
  extends TenantScopedRepository
  implements CommunicationRecordRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateCommunicationRecordData,
  ): Promise<CommunicationRecordRecord> {
    const row = await this.prisma.communicationRecord.create({
      data: {
        tenant: { connect: { id: tenantId } },
        channel: data.channel,
        direction: data.direction,
        status: data.status ?? 'draft',
        subject: data.subject ?? null,
        body: data.body ?? null,
        failureReason: data.failureReason ?? null,
        occurredAt: data.occurredAt ?? new Date(),
        sentAt: data.sentAt ?? null,
        deliveredAt: data.deliveredAt ?? null,
        readAt: data.readAt ?? null,
        failedAt: data.failedAt ?? null,
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
        ...(data.templateId
          ? { template: { connect: { id: data.templateId } } }
          : {}),
        ...(data.createdByUserId
          ? { createdBy: { connect: { id: data.createdByUserId } } }
          : {}),
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<CommunicationRecordRecord | null> {
    const row = await this.prisma.communicationRecord.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findAll(
    tenantId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]> {
    const rows = await this.prisma.communicationRecord.findMany({
      where: {
        tenantId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]> {
    const rows = await this.prisma.communicationRecord.findMany({
      where: {
        tenantId,
        bookingId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
    options?: { includeDeleted?: boolean },
  ): Promise<CommunicationRecordRecord[]> {
    const rows = await this.prisma.communicationRecord.findMany({
      where: {
        tenantId,
        customerId,
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateCommunicationRecordData,
    version: number,
  ): Promise<CommunicationRecordRecord> {
    try {
      const row = await this.prisma.communicationRecord.update({
        where: { id, tenantId, version },
        data: {
          subject: data.subject,
          body: data.body,
          bookingId: data.bookingId,
          customerId: data.customerId,
          vendorId: data.vendorId,
          staffMemberId: data.staffMemberId,
          templateId: data.templateId,
          status: data.status,
          failureReason: data.failureReason,
          sentAt: data.sentAt,
          deliveredAt: data.deliveredAt,
          readAt: data.readAt,
          failedAt: data.failedAt,
          deletedAt: data.deletedAt,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('CommunicationRecord', id, error);
    }
  }

  private map(row: CommunicationRecord): CommunicationRecordRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      bookingId: row.bookingId,
      customerId: row.customerId,
      vendorId: row.vendorId,
      staffMemberId: row.staffMemberId,
      templateId: row.templateId,
      channel: row.channel,
      direction: row.direction,
      status: row.status,
      subject: row.subject,
      body: row.body,
      failureReason: row.failureReason,
      createdByUserId: row.createdByUserId,
      occurredAt: row.occurredAt,
      sentAt: row.sentAt,
      deliveredAt: row.deliveredAt,
      readAt: row.readAt,
      failedAt: row.failedAt,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
