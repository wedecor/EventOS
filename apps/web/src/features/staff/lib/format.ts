import type { StaffEmploymentType, StaffStatus } from '../schemas/staff.schemas';

export function formatStaffStatus(status: StaffStatus | string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatEmploymentType(
  type: StaffEmploymentType | string,
): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatStaffWhen(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
