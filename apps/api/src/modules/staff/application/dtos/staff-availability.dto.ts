import type { StaffAvailabilityRecord } from '../../domain/repositories/staff-availability.repository';

export type StaffAvailabilityDto = StaffAvailabilityRecord;

export function toStaffAvailabilityDto(
  record: StaffAvailabilityRecord,
): StaffAvailabilityDto {
  return { ...record };
}
