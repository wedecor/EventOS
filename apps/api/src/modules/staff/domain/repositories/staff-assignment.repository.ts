import type { StaffAssignmentStatus } from '@prisma/client';

export type StaffAssignmentRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  staffMemberId: string;
  role: string | null;
  isOnSiteLead: boolean;
  reportingAt: Date | null;
  note: string | null;
  status: StaffAssignmentStatus;
  confirmedAt: Date | null;
  releasedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateStaffAssignmentData = {
  bookingId: string;
  staffMemberId: string;
  role?: string | null;
  isOnSiteLead?: boolean;
  reportingAt?: Date | null;
  note?: string | null;
};

export type UpdateStaffAssignmentData = {
  status?: StaffAssignmentStatus;
  role?: string | null;
  isOnSiteLead?: boolean;
  reportingAt?: Date | null;
  note?: string | null;
  confirmedAt?: Date | null;
  releasedAt?: Date | null;
  cancelledAt?: Date | null;
  cancellationReason?: string | null;
};

export abstract class StaffAssignmentRepository {
  abstract create(
    tenantId: string,
    data: CreateStaffAssignmentData,
  ): Promise<StaffAssignmentRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<StaffAssignmentRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<StaffAssignmentRecord[]>;

  // EP1-STF-002 — Dashboard: tenant-wide assignment read for staff summary
  abstract findAll(tenantId: string): Promise<StaffAssignmentRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateStaffAssignmentData,
    version: number,
  ): Promise<StaffAssignmentRecord>;
}
