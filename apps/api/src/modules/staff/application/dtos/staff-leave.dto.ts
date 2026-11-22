import type { StaffLeaveRecord } from '../../domain/repositories/staff-leave.repository';

export type StaffLeaveDto = StaffLeaveRecord;

export function toStaffLeaveDto(record: StaffLeaveRecord): StaffLeaveDto {
  return { ...record };
}
