import { describe, expect, it } from 'vitest';
import {
  advanceStageFormSchema,
  cancelBookingFormSchema,
  parseBooking,
  parseWorkspace,
  toAdvanceStageRequest,
} from './booking.schemas';

const sampleBooking = {
  id: 'b1',
  tenantId: 't1',
  customerId: 'c1',
  leadId: 'l1',
  quotationId: 'q1',
  bookingNumber: 42,
  status: 'approved' as const,
  eventType: 'Wedding',
  eventStartDate: '2026-08-01',
  eventEndDate: '2026-08-02',
  venueName: 'Hall',
  guestCount: 100,
  requirementsNotes: null,
  workspaceStatus: 'inactive' as const,
  preparationStatus: 'pending' as const,
  operationalMilestone: null,
  executionOwnerId: null,
  cancellationReason: null,
  completedAt: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 1,
};

describe('booking schemas', () => {
  it('parses booking envelope', () => {
    expect(parseBooking({ data: sampleBooking }).bookingNumber).toBe(42);
  });

  it('parses workspace response from owner/stage endpoints', () => {
    expect(
      parseWorkspace({
        data: {
          eventId: 'b1',
          workspaceStatus: 'inactive',
          preparationStatus: 'ready',
          operationalMilestone: 'preparation',
          executionOwnerId: 's1',
        },
      }).preparationStatus,
    ).toBe('ready');
  });

  it('requires cancel reason', () => {
    expect(cancelBookingFormSchema.safeParse({ reason: '' }).success).toBe(
      false,
    );
    expect(
      cancelBookingFormSchema.safeParse({ reason: 'Client withdrew' }).success,
    ).toBe(true);
  });

  it('maps advance stage form to request body', () => {
    expect(
      toAdvanceStageRequest({
        milestoneKey: ' setup ',
        preparationStatus: 'ready',
      }),
    ).toEqual({ milestoneKey: 'setup', preparationStatus: 'ready' });

    expect(
      advanceStageFormSchema.safeParse({
        milestoneKey: '',
        preparationStatus: '',
      }).success,
    ).toBe(false);
  });
});
