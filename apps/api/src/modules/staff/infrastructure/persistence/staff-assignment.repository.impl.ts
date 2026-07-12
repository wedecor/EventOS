import { Injectable } from '@nestjs/common';
import type { StaffAssignment } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateStaffAssignmentData,
  StaffAssignmentRecord,
  StaffAssignmentRepository,
  UpdateStaffAssignmentData,
} from '../../domain/repositories/staff-assignment.repository';

@Injectable()
export class StaffAssignmentRepositoryImpl
  extends TenantScopedRepository
  implements StaffAssignmentRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateStaffAssignmentData,
  ): Promise<StaffAssignmentRecord> {
    const assignment = await this.prisma.staffAssignment.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        staffMember: { connect: { id: data.staffMemberId } },
        role: data.role ?? null,
        isOnSiteLead: data.isOnSiteLead ?? false,
        reportingAt: data.reportingAt ?? null,
        note: data.note ?? null,
      },
    });

    return this.mapRecord(assignment);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StaffAssignmentRecord | null> {
    const assignment = await this.prisma.staffAssignment.findFirst({
      where: { id, tenantId },
    });

    return assignment ? this.mapRecord(assignment) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<StaffAssignmentRecord[]> {
    const assignments = await this.prisma.staffAssignment.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return assignments.map((assignment) => this.mapRecord(assignment));
  }

  async findAll(tenantId: string): Promise<StaffAssignmentRecord[]> {
    const assignments = await this.prisma.staffAssignment.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((assignment) => this.mapRecord(assignment));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateStaffAssignmentData,
    version: number,
  ): Promise<StaffAssignmentRecord> {
    try {
      const assignment = await this.prisma.staffAssignment.update({
        where: { id, tenantId, version },
        data: {
          status: data.status,
          role: data.role,
          isOnSiteLead: data.isOnSiteLead,
          reportingAt: data.reportingAt,
          note: data.note,
          confirmedAt: data.confirmedAt,
          releasedAt: data.releasedAt,
          cancelledAt: data.cancelledAt,
          cancellationReason: data.cancellationReason,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(assignment);
    } catch (error: unknown) {
      return this.toConcurrentModification('StaffAssignment', id, error);
    }
  }

  private mapRecord(assignment: StaffAssignment): StaffAssignmentRecord {
    return {
      id: assignment.id,
      tenantId: assignment.tenantId,
      bookingId: assignment.bookingId,
      staffMemberId: assignment.staffMemberId,
      role: assignment.role,
      isOnSiteLead: assignment.isOnSiteLead,
      reportingAt: assignment.reportingAt,
      note: assignment.note,
      status: assignment.status,
      confirmedAt: assignment.confirmedAt,
      releasedAt: assignment.releasedAt,
      cancelledAt: assignment.cancelledAt,
      cancellationReason: assignment.cancellationReason,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      version: assignment.version,
    };
  }
}
