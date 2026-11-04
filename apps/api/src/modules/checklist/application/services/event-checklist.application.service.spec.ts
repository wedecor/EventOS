import { EventChecklistApplicationService } from './event-checklist.application.service';

describe('EventChecklistApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const templateId = 'tmpl-1';
  const checklistId = 'ec-1';

  let eventRepository: { findById: jest.Mock };
  let templateRepository: {
    findById: jest.Mock;
    findActiveMatchingEventType: jest.Mock;
  };
  let templateItemRepository: { findByTemplateId: jest.Mock };
  let eventChecklistRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByBookingId: jest.Mock;
    findByBookingAndTemplate: jest.Mock;
  };
  let eventChecklistItemRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByChecklistId: jest.Mock;
    update: jest.Mock;
  };
  let service: EventChecklistApplicationService;

  beforeEach(() => {
    eventRepository = { findById: jest.fn() };
    templateRepository = {
      findById: jest.fn(),
      findActiveMatchingEventType: jest.fn(),
    };
    templateItemRepository = { findByTemplateId: jest.fn() };
    eventChecklistRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findByBookingAndTemplate: jest.fn(),
    };
    eventChecklistItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByChecklistId: jest.fn(),
      update: jest.fn(),
    };
    service = new EventChecklistApplicationService(
      eventRepository as never,
      templateRepository as never,
      templateItemRepository as never,
      eventChecklistRepository,
      eventChecklistItemRepository as never,
    );
  });

  it('generateFromTemplates creates independent checklist copies', async () => {
    eventRepository.findById.mockResolvedValue({
      id: bookingId,
      status: 'in_preparation',
      eventType: 'Wedding',
    });
    templateRepository.findActiveMatchingEventType.mockResolvedValue([
      {
        id: templateId,
        name: 'Pre-Event',
        description: null,
        category: 'pre_event',
        status: 'active',
        templateVersion: 1,
        sortOrder: 0,
      },
    ]);
    eventChecklistRepository.findByBookingAndTemplate.mockResolvedValue(null);
    templateItemRepository.findByTemplateId.mockResolvedValue([
      {
        id: 'ti-1',
        title: 'Confirm venue',
        description: null,
        isRequired: true,
        defaultAssigneeRole: 'coordinator',
        estimatedDurationMinutes: 15,
        sortOrder: 0,
      },
    ]);
    eventChecklistRepository.create.mockResolvedValue({
      id: checklistId,
      tenantId,
      bookingId,
      templateId,
      templateVersion: 1,
      name: 'Pre-Event',
      description: null,
      category: 'pre_event',
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });
    eventChecklistItemRepository.create.mockResolvedValue({
      id: 'eci-1',
      checklistId,
      title: 'Confirm venue',
      isCompleted: false,
      sortOrder: 0,
    });

    const result = await service.generateFromTemplates(tenantId, { bookingId });
    expect(result.ok).toBe(true);
    expect(eventChecklistRepository.create).toHaveBeenCalled();
    expect(eventChecklistItemRepository.create).toHaveBeenCalledWith(
      tenantId,
      checklistId,
      expect.objectContaining({ title: 'Confirm venue' }),
    );
  });

  it('generateFromTemplates skips templates already generated for booking', async () => {
    eventRepository.findById.mockResolvedValue({
      id: bookingId,
      status: 'in_preparation',
      eventType: 'Wedding',
    });
    templateRepository.findActiveMatchingEventType.mockResolvedValue([
      { id: templateId, status: 'active', name: 'Pre-Event' },
    ]);
    eventChecklistRepository.findByBookingAndTemplate.mockResolvedValue({
      id: checklistId,
      name: 'Pre-Event',
    });
    eventChecklistItemRepository.findByChecklistId.mockResolvedValue([]);

    const result = await service.generateFromTemplates(tenantId, { bookingId });
    expect(result.ok).toBe(true);
    expect(eventChecklistRepository.create).not.toHaveBeenCalled();
  });

  it('updateItem completes and undoes checklist items', async () => {
    eventChecklistRepository.findById.mockResolvedValue({ id: checklistId });
    eventChecklistItemRepository.findById.mockResolvedValue({
      id: 'eci-1',
      checklistId,
      isCompleted: false,
      completedAt: null,
      notes: null,
      version: 1,
    });
    eventChecklistItemRepository.update.mockResolvedValue({
      id: 'eci-1',
      checklistId,
      isCompleted: true,
      completedAt: new Date(),
      completedByUserId: 'user-1',
      notes: 'done',
      version: 2,
    });

    const result = await service.updateItem(
      tenantId,
      checklistId,
      'eci-1',
      {
        isCompleted: true,
        notes: 'done',
        completedByUserId: 'user-1',
      },
      1,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCompleted).toBe(true);
    }
  });

  it('listForBooking returns NOT_FOUND when booking missing', async () => {
    eventRepository.findById.mockResolvedValue(null);
    const result = await service.listForBooking(tenantId, bookingId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });
});
