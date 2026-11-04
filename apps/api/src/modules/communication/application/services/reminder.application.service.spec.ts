import { ReminderApplicationService } from './reminder.application.service';

describe('ReminderApplicationService', () => {
  const tenantId = 'tenant-1';

  let service: ReminderApplicationService;
  let reminderRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
    findByBookingId: jest.Mock;
    findByCustomerId: jest.Mock;
    update: jest.Mock;
  };
  let eventRepository: { findById: jest.Mock };
  let customerRepository: { findById: jest.Mock };
  let vendorRepository: { findById: jest.Mock };
  let staffMemberRepository: { findById: jest.Mock };
  let communicationRecordRepository: { findById: jest.Mock };

  beforeEach(() => {
    reminderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByBookingId: jest.fn(),
      findByCustomerId: jest.fn(),
      update: jest.fn(),
    };
    eventRepository = { findById: jest.fn() };
    customerRepository = { findById: jest.fn() };
    vendorRepository = { findById: jest.fn() };
    staffMemberRepository = { findById: jest.fn() };
    communicationRecordRepository = { findById: jest.fn() };

    service = new ReminderApplicationService(
      reminderRepository,
      eventRepository as never,
      customerRepository as never,
      vendorRepository as never,
      staffMemberRepository as never,
      communicationRecordRepository as never,
    );
  });

  it('completes a pending reminder', async () => {
    reminderRepository.findById.mockResolvedValue({
      id: 'rem-1',
      status: 'pending',
      version: 1,
    });
    reminderRepository.update.mockResolvedValue({
      id: 'rem-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      communicationRecordId: null,
      category: 'other',
      title: 'Follow up',
      notes: null,
      dueAt: new Date(),
      status: 'completed',
      assignedToUserId: null,
      completedAt: new Date(),
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.complete(tenantId, 'rem-1', 1);

    expect(result.ok).toBe(true);
    expect(reminderRepository.update).toHaveBeenCalledWith(
      tenantId,
      'rem-1',
      expect.objectContaining({
        status: 'completed',
        completedAt: expect.any(Date),
      }),
      1,
    );
  });

  it('cancels a pending reminder', async () => {
    reminderRepository.findById.mockResolvedValue({
      id: 'rem-1',
      status: 'pending',
      version: 1,
    });
    reminderRepository.update.mockResolvedValue({
      id: 'rem-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      communicationRecordId: null,
      category: 'other',
      title: 'Follow up',
      notes: null,
      dueAt: new Date(),
      status: 'cancelled',
      assignedToUserId: null,
      completedAt: null,
      cancelledAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.cancel(tenantId, 'rem-1', 1);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('cancelled');
    }
  });

  it('rejects complete when not pending', async () => {
    reminderRepository.findById.mockResolvedValue({
      id: 'rem-1',
      status: 'completed',
      version: 2,
    });

    const result = await service.complete(tenantId, 'rem-1', 2);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects cancel when already cancelled', async () => {
    reminderRepository.findById.mockResolvedValue({
      id: 'rem-1',
      status: 'cancelled',
      version: 2,
    });

    const result = await service.cancel(tenantId, 'rem-1', 2);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });
});
