import { Injectable } from '@nestjs/common';
import type { StaffLeave, StaffLeaveStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateStaffLeaveData,
  StaffLeaveRecord,
  StaffLeaveRepository,
  UpdateStaffLeaveData,
} from '../../domain/repositories/staff-leave.repository';

@Injectable()
export class StaffLeaveRepositoryImpl
  extends TenantScopedRepository
  implements StaffLeaveRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateStaffLeaveData,
  ): Promise<StaffLeaveRecord> {
    const row = await this.prisma.staffLeave.create({
      data: {
        tenant: { connect: { id: tenantId } },
        staffMember: { connect: { id: data.staffMemberId } },
        leaveType: data.leaveType,
        startDate: data.startDate,
        endDate: data.endDate,
        reason: data.reason ?? null,
        notes: data.notes ?? null,
      },
    });
    return this.map(row);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StaffLeaveRecord | null> {
    const row = await this.prisma.staffLeave.findFirst({
      where: { id, tenantId },
    });
    return row ? this.map(row) : null;
  }

  async findByStaffMemberId(
    tenantId: string,
    staffMemberId: string,
    status?: StaffLeaveStatus,
  ): Promise<StaffLeaveRecord[]> {
    const rows = await this.prisma.staffLeave.findMany({
      where: {
        tenantId,
        staffMemberId,
        ...(status ? { status } : {}),
      },
      orderBy: { startDate: 'desc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findApprovedOverlapping(
    tenantId: string,
    staffMemberId: string,
    from: Date,
    to: Date,
  ): Promise<StaffLeaveRecord[]> {
    const rows = await this.prisma.staffLeave.findMany({
      where: {
        tenantId,
        staffMemberId,
        status: 'approved',
        startDate: { lte: to },
        endDate: { gte: from },
      },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async findApprovedInRange(
    tenantId: string,
    from: Date,
    to: Date,
    staffMemberId?: string,
  ): Promise<StaffLeaveRecord[]> {
    const rows = await this.prisma.staffLeave.findMany({
      where: {
        tenantId,
        status: 'approved',
        startDate: { lte: to },
        endDate: { gte: from },
        ...(staffMemberId ? { staffMemberId } : {}),
      },
      orderBy: { startDate: 'asc' },
    });
    return rows.map((r) => this.map(r));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateStaffLeaveData,
    version: number,
  ): Promise<StaffLeaveRecord> {
    try {
      const row = await this.prisma.staffLeave.update({
        where: { id, tenantId, version },
        data: {
          leaveType: data.leaveType,
          status: data.status,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          notes: data.notes,
          reviewedByUserId: data.reviewedByUserId,
          reviewedAt: data.reviewedAt,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    } catch (error: unknown) {
      return this.toConcurrentModification('StaffLeave', id, error);
    }
  }

  private map(row: StaffLeave): StaffLeaveRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      staffMemberId: row.staffMemberId,
      leaveType: row.leaveType,
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      notes: row.notes,
      reviewedByUserId: row.reviewedByUserId,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
