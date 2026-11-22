import type { StaffLeaveStatus, StaffLeaveType } from '@prisma/client';

export type StaffLeaveRecord = {
  id: string;
  tenantId: string;
  staffMemberId: string;
  leaveType: StaffLeaveType;
  status: StaffLeaveStatus;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  notes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateStaffLeaveData = {
  staffMemberId: string;
  leaveType: StaffLeaveType;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
  notes?: string | null;
};

export type UpdateStaffLeaveData = {
  leaveType?: StaffLeaveType;
  status?: StaffLeaveStatus;
  startDate?: Date;
  endDate?: Date;
  reason?: string | null;
  notes?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: Date | null;
};

export abstract class StaffLeaveRepository {
  abstract create(
    tenantId: string,
    data: CreateStaffLeaveData,
  ): Promise<StaffLeaveRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<StaffLeaveRecord | null>;

  abstract findByStaffMemberId(
    tenantId: string,
    staffMemberId: string,
    status?: StaffLeaveStatus,
  ): Promise<StaffLeaveRecord[]>;

  abstract findApprovedOverlapping(
    tenantId: string,
    staffMemberId: string,
    from: Date,
    to: Date,
  ): Promise<StaffLeaveRecord[]>;

  abstract findApprovedInRange(
    tenantId: string,
    from: Date,
    to: Date,
    staffMemberId?: string,
  ): Promise<StaffLeaveRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateStaffLeaveData,
    version: number,
  ): Promise<StaffLeaveRecord>;
}
