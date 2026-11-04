import type { StaffEmploymentType, StaffMemberStatus } from '@prisma/client';

export type StaffMemberRecord = {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  role: string;
  department: string | null;
  phone: string;
  email: string | null;
  employmentType: StaffEmploymentType;
  status: StaffMemberStatus;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateStaffMemberData = {
  name: string;
  role: string;
  department?: string | null;
  phone: string;
  email?: string | null;
  status?: StaffMemberStatus;
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: Date | null;
};

export type UpdateStaffMemberData = {
  name?: string;
  role?: string;
  department?: string | null;
  phone?: string;
  email?: string | null;
  status?: StaffMemberStatus;
  userId?: string | null;
  employmentType?: StaffEmploymentType;
  joinedAt?: Date | null;
};

export type FindStaffMembersFilter = {
  status?: StaffMemberStatus;
};

export abstract class StaffMemberRepository {
  abstract create(
    tenantId: string,
    data: CreateStaffMemberData,
  ): Promise<StaffMemberRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<StaffMemberRecord | null>;

  abstract findByUserId(
    tenantId: string,
    userId: string,
  ): Promise<StaffMemberRecord | null>;

  /**
   * Resolve StaffMember by id, or by linked userId (legacy bridge),
   * or create a StaffMember from an existing User when needed.
   */
  abstract resolveForAssignment(
    tenantId: string,
    staffMemberOrUserId: string,
  ): Promise<StaffMemberRecord | null>;

  abstract findMany(
    tenantId: string,
    filter?: FindStaffMembersFilter,
  ): Promise<StaffMemberRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateStaffMemberData,
    version: number,
  ): Promise<StaffMemberRecord>;
}
