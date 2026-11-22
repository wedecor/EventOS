import { Injectable } from '@nestjs/common';
import type { StaffAvailability } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateStaffAvailabilityData,
  StaffAvailabilityRecord,
  StaffAvailabilityRepository,
  UpdateStaffAvailabilityData,
} from '../../domain/repositories/staff-availability.repository';

@Injectable()
export class StaffAvailabilityRepositoryImpl
  extends TenantScopedRepository
  implements StaffAvailabilityRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateStaffAvailabilityData,
  ): Promise<StaffAvailabilityRecord> {
    const row = await this.prisma.staffAvailability.create({
      data: {
        tenant: { connect: { id: tenantId } },
        staffMember: { connect: { id: data.staffMemberId } },
        date: data.date ?? null,
        weekday: data.weekday ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        kind: data.kind,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StaffAvailabilityRecord | null> {
    const row = await this.prisma.staffAvailability.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByStaffMemberId(
    tenantId: string,
    staffMemberId: string,
  ): Promise<StaffAvailabilityRecord[]> {
    const rows = await this.prisma.staffAvailability.findMany({
      where: { tenantId, staffMemberId },
      orderBy: [{ date: 'asc' }, { weekday: 'asc' }],
    });
    return rows.map((r) => this.map(r));
  }

  async findForStaffInRange(
    tenantId: string,
    staffMemberId: string,
    from: Date,
    to: Date,
  ): Promise<StaffAvailabilityRecord[]> {
    const rows = await this.prisma.staffAvailability.findMany({
      where: {
        tenantId,
        staffMemberId,
        OR: [{ weekday: { not: null } }, { date: { gte: from, lte: to } }],
      },
      orderBy: [{ date: 'asc' }, { weekday: 'asc' }],
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateStaffAvailabilityData,
    version: number,
  ): Promise<StaffAvailabilityRecord> {
    try {
      const row = await this.prisma.staffAvailability.update({
        where: { id, tenantId, version },
        data: {
          date: data.date,
          weekday: data.weekday,
          startTime: data.startTime,
          endTime: data.endTime,
          kind: data.kind,
          reason: data.reason,
          notes: data.notes,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('StaffAvailability', id, error);
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.staffAvailability.deleteMany({ where: { id, tenantId } });
  }

  private map(row: StaffAvailability): StaffAvailabilityRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      staffMemberId: row.staffMemberId,
      date: row.date,
      weekday: row.weekday,
      startTime: row.startTime,
      endTime: row.endTime,
      kind: row.kind,
      reason: row.reason,
      notes: row.notes,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
