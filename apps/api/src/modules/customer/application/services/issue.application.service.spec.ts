import { IssueNoteCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import type { EventRecord } from '../../../booking/domain/repositories/event.repository';
import type { IssueNoteRecord } from '../../domain/repositories/issue-note.repository';
import { IssueApplicationService } from './issue.application.service';

describe('IssueApplicationService', () => {
  const tenantId = 'tenant-1';
  const eventId = 'event-1';
  const customerId = 'customer-1';

  const event: EventRecord = {
    id: eventId,
    tenantId,
    customerId,
    leadId: null,
    quotationId: 'quotation-1',
    bookingNumber: 1001,
    status: 'approved',
    eventType: null,
    eventStartDate: null,
    eventEndDate: null,
    venueName: null,
    guestCount: null,
    requirementsNotes: null,
    workspaceStatus: 'inactive',
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const note: IssueNoteRecord = {
    id: 'issue-1',
    tenantId,
    eventId,
    customerId,
    message: 'Late delivery complaint',
    severity: 'high',
    notes: null,
    status: 'open',
    createdAt: new Date('2026-07-13T10:00:00.000Z'),
  };

  let issueNoteRepository: { create: jest.Mock };
  let eventRepository: { findById: jest.Mock };
  let publish: jest.Mock;
  let service: IssueApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    issueNoteRepository = { create: jest.fn() };
    eventRepository = { findById: jest.fn() };
    service = new IssueApplicationService(
      issueNoteRepository,
      eventRepository as never,
      { publish },
    );
  });

  it('returns NOT_FOUND when event missing (cross-tenant protection)', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createIssueNote(tenantId, eventId, {
      message: 'Issue',
      severity: 'medium',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(issueNoteRepository.create).not.toHaveBeenCalled();
  });

  it('rejects blank message', async () => {
    eventRepository.findById.mockResolvedValue(event);

    const result = await service.createIssueNote(tenantId, eventId, {
      message: '   ',
      severity: 'low',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('creates issue with customerId from event and publishes event', async () => {
    eventRepository.findById.mockResolvedValue(event);
    issueNoteRepository.create.mockResolvedValue(note);

    const result = await service.createIssueNote(tenantId, eventId, {
      message: ' Late delivery complaint ',
      severity: 'high',
      notes: '  follow up  ',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        id: note.id,
        eventId,
        status: 'open',
      });
    }
    expect(issueNoteRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        eventId,
        customerId,
        message: 'Late delivery complaint',
        notes: 'follow up',
      }),
    );
    expect(publish).toHaveBeenCalledWith(expect.any(IssueNoteCreatedEvent));
  });
});
