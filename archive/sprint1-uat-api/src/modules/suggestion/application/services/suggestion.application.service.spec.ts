import { SuggestionApplicationService } from './suggestion.application.service';
import type { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import type { EventRepository } from '../../../booking/domain/repositories/event.repository';
import type { UserRepository } from '../../../platform/domain/repositories/user.repository';
import type {
  SuggestionRecord,
  SuggestionRepository,
} from '../../domain/repositories/suggestion.repository';

describe('SuggestionApplicationService', () => {
  const tenantId = 'tenant-1';
  const suggestionId = 'suggestion-1';
  const eventId = 'event-1';

  const pendingWorkspace: SuggestionRecord = {
    id: suggestionId,
    tenantId,
    type: 'workspace.create',
    status: 'pending',
    aggregateType: 'Event',
    aggregateId: eventId,
    payload: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let suggestionRepository: jest.Mocked<SuggestionRepository>;
  let bookingApplicationService: jest.Mocked<
    Pick<BookingApplicationService, 'activateBooking'>
  >;
  let eventRepository: jest.Mocked<
    Pick<EventRepository, 'findById' | 'update'>
  >;
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById'>>;
  let service: SuggestionApplicationService;

  beforeEach(() => {
    suggestionRepository = {
      create: jest.fn(),
      findPendingByAggregate: jest.fn(),
      listByStatus: jest.fn(),
      findById: jest.fn(),
      updateStatus: jest.fn(),
    };
    bookingApplicationService = {
      activateBooking: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    userRepository = {
      findById: jest.fn(),
    };

    service = new SuggestionApplicationService(
      suggestionRepository,
      bookingApplicationService as unknown as BookingApplicationService,
      eventRepository as unknown as EventRepository,
      userRepository as unknown as UserRepository,
    );
  });

  it('dismisses a pending suggestion', async () => {
    suggestionRepository.findById.mockResolvedValue(pendingWorkspace);
    suggestionRepository.updateStatus.mockResolvedValue({
      ...pendingWorkspace,
      status: 'dismissed',
      version: 2,
    });

    const result = await service.dismissSuggestion(tenantId, suggestionId);

    expect(result.ok).toBe(true);
    expect(suggestionRepository.updateStatus.mock.calls[0]).toEqual([
      tenantId,
      suggestionId,
      'dismissed',
      1,
    ]);
  });

  it('accepts workspace.create and activates booking', async () => {
    suggestionRepository.findById.mockResolvedValue(pendingWorkspace);
    eventRepository.findById.mockResolvedValue({
      id: eventId,
      tenantId,
      customerId: 'customer-1',
      leadId: null,
      quotationId: 'quotation-1',
      bookingNumber: 1,
      status: 'approved',
      eventType: null,
      eventStartDate: null,
      eventEndDate: null,
      venueName: null,
      guestCount: null,
      requirementsNotes: null,
      preparationStatus: 'pending',
      operationalMilestone: null,
      executionOwnerId: null,
      cancellationReason: null,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 3,
    });
    bookingApplicationService.activateBooking.mockResolvedValue({
      ok: true,
      value: {} as never,
    });
    suggestionRepository.updateStatus.mockResolvedValue({
      ...pendingWorkspace,
      status: 'accepted',
      version: 2,
    });

    const result = await service.acceptSuggestion(tenantId, suggestionId);

    expect(result.ok).toBe(true);
    expect(bookingApplicationService.activateBooking.mock.calls[0]).toEqual([
      tenantId,
      eventId,
      { version: 3 },
    ]);
  });
});
