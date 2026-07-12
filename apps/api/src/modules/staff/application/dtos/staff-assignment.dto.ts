import type { StaffAssignmentRecord } from '../../domain/repositories/staff-assignment.repository';

export type StaffAssignmentDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  staffMemberId: string;
  role: string | null;
  isOnSiteLead: boolean;
  reportingAt: Date | null;
  note: string | null;
  status: StaffAssignmentRecord['status'];
  confirmedAt: Date | null;
  releasedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toStaffAssignmentDto(
  record: StaffAssignmentRecord,
): StaffAssignmentDto {
  return { ...record };
}
