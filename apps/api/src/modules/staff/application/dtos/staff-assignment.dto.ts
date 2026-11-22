import type { StaffAssignmentRecord } from '../../domain/repositories/staff-assignment.repository';
import type { StaffMemberRecord } from '../../domain/repositories/staff-member.repository';

export type StaffAssignmentMemberSummaryDto = {
  id: string;
  name: string;
  operationalRole: string;
  employmentType: StaffMemberRecord['employmentType'];
  status: StaffMemberRecord['status'];
};

export type StaffAssignmentDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  staffMemberId: string;
  /** Expand-contract legacy User id (nullable). */
  legacyUserId: string | null;
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
  staffMember: StaffAssignmentMemberSummaryDto | null;
};

export function toStaffAssignmentDto(
  record: StaffAssignmentRecord,
  staffMember?: StaffMemberRecord | null,
): StaffAssignmentDto {
  return {
    id: record.id,
    tenantId: record.tenantId,
    bookingId: record.bookingId,
    staffMemberId: record.staffMemberId,
    legacyUserId: record.legacyUserId,
    role: record.role,
    isOnSiteLead: record.isOnSiteLead,
    reportingAt: record.reportingAt,
    note: record.note,
    status: record.status,
    confirmedAt: record.confirmedAt,
    releasedAt: record.releasedAt,
    cancelledAt: record.cancelledAt,
    cancellationReason: record.cancellationReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
    staffMember: staffMember
      ? {
          id: staffMember.id,
          name: staffMember.name,
          operationalRole: staffMember.role,
          employmentType: staffMember.employmentType,
          status: staffMember.status,
        }
      : null,
  };
}
