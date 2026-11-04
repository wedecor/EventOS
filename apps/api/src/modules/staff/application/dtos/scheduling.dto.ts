export type SchedulingConflictCode =
  | 'overlapping_assignment'
  | 'approved_leave'
  | 'unavailable'
  | 'staff_inactive';

export type SchedulingConflictDto = {
  code: SchedulingConflictCode;
  message: string;
  details?: Record<string, unknown>;
};

export type StaffWorkloadDto = {
  staffMemberId: string;
  name: string;
  employmentType: string;
  status: string;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  upcomingConfirmed: number;
};

export type SchedulingCalendarEntryDto = {
  type: 'assignment' | 'leave' | 'availability';
  staffMemberId: string;
  staffName: string;
  date: string;
  endDate?: string;
  label: string;
  meta?: Record<string, unknown>;
};

export type StaffRecommendationDto = {
  staffMemberId: string;
  name: string;
  employmentType: string;
  operationalRole: string;
  score: number;
  reasons: string[];
  conflicts: SchedulingConflictDto[];
};
