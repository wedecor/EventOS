import type { StaffMemberRecord } from '../../domain/repositories/staff-member.repository';

export type StaffMemberDto = {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  /** Operational role (decorator / coordinator / helper, etc.). */
  role: string;
  /** Alias of `role` for P2-04 domain wording. */
  operationalRole: string;
  department: string | null;
  phone: string;
  email: string | null;
  employmentType: StaffMemberRecord['employmentType'];
  status: StaffMemberRecord['status'];
  /** True when status is `active`. */
  active: boolean;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toStaffMemberDto(record: StaffMemberRecord): StaffMemberDto {
  return {
    id: record.id,
    tenantId: record.tenantId,
    userId: record.userId,
    name: record.name,
    role: record.role,
    operationalRole: record.role,
    department: record.department,
    phone: record.phone,
    email: record.email,
    employmentType: record.employmentType,
    status: record.status,
    active: record.status === 'active',
    joinedAt: record.joinedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}
