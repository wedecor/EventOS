import { EventNoteApplicationService } from './event-note.application.service';

describe('EventNoteApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const userId = 'user-1';

  const booking = {
    id: bookingId,
    tenantId,
    status: 'in_preparation' as const,
  };

  let eventRepository: {
    findById: jest.Mock;
  };
  let eventNoteRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByBookingId: jest.Mock;
    remove: jest.Mock;
  };
  let service: EventNoteApplicationService;

  beforeEach(() => {
    eventRepository = { findById: jest.fn() };
    eventNoteRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      remove: jest.fn(),
    };
    service = new EventNoteApplicationService(
      eventRepository as never,
      eventNoteRepository,
    );
  });

  it('lists notes for a booking', async () => {
    eventRepository.findById.mockResolvedValue(booking);
    eventNoteRepository.findByBookingId.mockResolvedValue([
      {
        id: 'note-1',
        tenantId,
        bookingId,
        body: 'Pack flowers early',
        createdByUserId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
    ]);

    const result = await service.listNotes(tenantId, bookingId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].body).toBe('Pack flowers early');
    }
  });

  it('creates a note', async () => {
    eventRepository.findById.mockResolvedValue(booking);
    eventNoteRepository.create.mockResolvedValue({
      id: 'note-1',
      tenantId,
      bookingId,
      body: 'Call venue',
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.createNote(tenantId, bookingId, {
      body: 'Call venue',
      createdByUserId: userId,
    });

    expect(result.ok).toBe(true);
    expect(eventNoteRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId,
      body: 'Call venue',
      createdByUserId: userId,
    });
  });

  it('rejects empty note body', async () => {
    const result = await service.createNote(tenantId, bookingId, {
      body: '   ',
      createdByUserId: userId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('deletes a note', async () => {
    eventNoteRepository.findById.mockResolvedValue({
      id: 'note-1',
      tenantId,
      bookingId,
      body: 'x',
      createdByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.deleteNote(tenantId, bookingId, 'note-1');
    expect(result.ok).toBe(true);
    expect(eventNoteRepository.remove).toHaveBeenCalledWith(tenantId, 'note-1');
  });
});
