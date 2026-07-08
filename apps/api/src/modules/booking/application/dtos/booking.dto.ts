import type { EventRecord } from '../../domain/repositories/event.repository';

export type BookingDto = {
  id: string;
  tenantId: string;
  customerId: string;
  leadId: string | null;
  quotationId: string;
  bookingNumber: number;
  status: EventRecord['status'];
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venueName: string | null;
  guestCount: number | null;
  requirementsNotes: string | null;
  preparationStatus: EventRecord['preparationStatus'];
  operationalMilestone: string | null;
  executionOwnerId: string | null;
  cancellationReason: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toBookingDto(event: EventRecord): BookingDto {
  return { ...event };
}
