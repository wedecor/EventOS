import { Injectable } from '@nestjs/common';
import type { StaffMember } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateStaffMemberData,
  FindStaffMembersFilter,
  StaffMemberRecord,
  StaffMemberRepository,
  UpdateStaffMemberData,
} from '../../domain/repositories/staff-member.repository';

@Injectable()
export class StaffMemberRepositoryImpl
  extends TenantScopedRepository
  implements StaffMemberRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateStaffMemberData,
  ): Promise<StaffMemberRecord> {
    const staffMember = await this.prisma.staffMember.create({
      data: {
        tenant: { connect: { id: tenantId } },
        ...(data.userId ? { user: { connect: { id: data.userId } } } : {}),
        name: data.name,
        role: data.role,
        department: data.department ?? null,
        phone: data.phone,
        email: data.email ?? null,
        employmentType: data.employmentType ?? 'temporary',
        status: data.status,
        joinedAt: data.joinedAt ?? null,
      },
    });

    return this.mapRecord(staffMember);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<StaffMemberRecord | null> {
    const staffMember = await this.prisma.staffMember.findFirst({
      where: { id, tenantId },
    });

    return staffMember ? this.mapRecord(staffMember) : null;
  }

  async findByUserId(
    tenantId: string,
    userId: string,
  ): Promise<StaffMemberRecord | null> {
    const staffMember = await this.prisma.staffMember.findFirst({
      where: { tenantId, userId },
    });
    return staffMember ? this.mapRecord(staffMember) : null;
  }

  async resolveForAssignment(
    tenantId: string,
    staffMemberOrUserId: string,
  ): Promise<StaffMemberRecord | null> {
    const byId = await this.findById(tenantId, staffMemberOrUserId);
    if (byId) {
      return byId;
    }

    const byUser = await this.findByUserId(tenantId, staffMemberOrUserId);
    if (byUser) {
      return byUser;
    }

    const user = await this.prisma.user.findFirst({
      where: { id: staffMemberOrUserId, tenantId },
    });
    if (!user) {
      return null;
    }

    return this.create(tenantId, {
      userId: user.id,
      name: user.name,
      role: user.role?.trim() ? user.role.trim() : 'decorator',
      phone: user.email || 'unknown',
      email: user.email,
      employmentType: 'temporary',
      status: 'active',
      joinedAt: user.createdAt,
    });
  }

  async findMany(
    tenantId: string,
    filter?: FindStaffMembersFilter,
  ): Promise<StaffMemberRecord[]> {
    const staffMembers = await this.prisma.staffMember.findMany({
      where: {
        tenantId,
        status: filter?.status,
      },
      orderBy: { createdAt: 'asc' },
    });

    return staffMembers.map((staffMember) => this.mapRecord(staffMember));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateStaffMemberData,
    version: number,
  ): Promise<StaffMemberRecord> {
    try {
      const staffMember = await this.prisma.staffMember.update({
        where: { id, tenantId, version },
        data: {
          name: data.name,
          role: data.role,
          department: data.department,
          phone: data.phone,
          email: data.email,
          status: data.status,
          employmentType: data.employmentType,
          joinedAt: data.joinedAt,
          ...(data.userId === undefined
            ? {}
            : data.userId === null
              ? { user: { disconnect: true } }
              : { user: { connect: { id: data.userId } } }),
          version: { increment: 1 },
        },
      });

      return this.mapRecord(staffMember);
    } catch (error: unknown) {
      return this.toConcurrentModification('StaffMember', id, error);
    }
  }

  private mapRecord(staffMember: StaffMember): StaffMemberRecord {
    return {
      id: staffMember.id,
      tenantId: staffMember.tenantId,
      userId: staffMember.userId,
      name: staffMember.name,
      role: staffMember.role,
      department: staffMember.department,
      phone: staffMember.phone,
      email: staffMember.email,
      employmentType: staffMember.employmentType,
      status: staffMember.status,
      joinedAt: staffMember.joinedAt,
      createdAt: staffMember.createdAt,
      updatedAt: staffMember.updatedAt,
      version: staffMember.version,
    };
  }
}
