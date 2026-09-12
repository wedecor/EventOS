import type { EventStatus } from '@prisma/client';

// EP1-OPS-001, EP1-OPS-005 — Booking summary: approved-event volume and status mix, read-only
// projection of Event data (event workspace visibility without asking Zakir for status).
export type BookingSummaryDto = {
  totalBookings: number;
  byStatus: Partial<Record<EventStatus, number>>;
  upcomingCount: number;
};
