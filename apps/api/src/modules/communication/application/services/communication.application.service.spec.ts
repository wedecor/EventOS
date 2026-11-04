import { CommunicationApplicationService } from './communication.application.service';

describe('CommunicationApplicationService', () => {
  const tenantId = 'tenant-1';

  let service: CommunicationApplicationService;
  let recordRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findAll: jest.Mock;
    findByBookingId: jest.Mock;
    findByCustomerId: jest.Mock;
    update: jest.Mock;
  };
  let attachmentRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByCommunicationRecordId: jest.Mock;
    update: jest.Mock;
  };
  let templateRepository: { findById: jest.Mock };
  let eventRepository: { findById: jest.Mock };
  let customerRepository: { findById: jest.Mock };
  let vendorRepository: { findById: jest.Mock };
  let staffMemberRepository: { findById: jest.Mock };

  beforeEach(() => {
    recordRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByBookingId: jest.fn(),
      findByCustomerId: jest.fn(),
      update: jest.fn(),
    };
    attachmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCommunicationRecordId: jest.fn(),
      update: jest.fn(),
    };
    templateRepository = { findById: jest.fn() };
    eventRepository = { findById: jest.fn() };
    customerRepository = { findById: jest.fn() };
    vendorRepository = { findById: jest.fn() };
    staffMemberRepository = { findById: jest.fn() };

    service = new CommunicationApplicationService(
      recordRepository,
      attachmentRepository,
      templateRepository as never,
      eventRepository as never,
      customerRepository as never,
      vendorRepository as never,
      staffMemberRepository as never,
    );
  });

  it('creates a draft communication', async () => {
    recordRepository.create.mockResolvedValue({
      id: 'comm-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      templateId: null,
      channel: 'email',
      direction: 'outgoing',
      status: 'draft',
      subject: 'Hello',
      body: 'Body',
      failureReason: null,
      createdByUserId: 'user-1',
      occurredAt: new Date(),
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.create(tenantId, {
      channel: 'email',
      direction: 'outgoing',
      subject: 'Hello',
      body: 'Body',
      createdByUserId: 'user-1',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('draft');
    }
  });

  it('allows creating manual channels as completed', async () => {
    recordRepository.create.mockResolvedValue({
      id: 'comm-2',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      templateId: null,
      channel: 'phone_call',
      direction: 'outgoing',
      status: 'completed',
      subject: null,
      body: 'Called client',
      failureReason: null,
      createdByUserId: 'user-1',
      occurredAt: new Date(),
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.create(tenantId, {
      channel: 'phone_call',
      direction: 'outgoing',
      status: 'completed',
      body: 'Called client',
      createdByUserId: 'user-1',
    });

    expect(result.ok).toBe(true);
    expect(recordRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ status: 'completed', channel: 'phone_call' }),
    );
  });

  it('rejects creating non-manual channels as completed', async () => {
    const result = await service.create(tenantId, {
      channel: 'whatsapp',
      direction: 'outgoing',
      status: 'completed',
      body: 'Hi',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('transitions draft → queued → sent', async () => {
    recordRepository.findById.mockResolvedValue({
      id: 'comm-1',
      deletedAt: null,
      status: 'draft',
      channel: 'email',
      version: 1,
    });
    recordRepository.update.mockResolvedValue({
      id: 'comm-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      templateId: null,
      channel: 'email',
      direction: 'outgoing',
      status: 'queued',
      subject: null,
      body: null,
      failureReason: null,
      createdByUserId: null,
      occurredAt: new Date(),
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const queued = await service.transitionStatus(
      tenantId,
      'comm-1',
      { status: 'queued' },
      1,
    );
    expect(queued.ok).toBe(true);

    recordRepository.findById.mockResolvedValue({
      id: 'comm-1',
      deletedAt: null,
      status: 'queued',
      channel: 'email',
      version: 2,
    });
    recordRepository.update.mockResolvedValue({
      id: 'comm-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      templateId: null,
      channel: 'email',
      direction: 'outgoing',
      status: 'sent',
      subject: null,
      body: null,
      failureReason: null,
      createdByUserId: null,
      occurredAt: new Date(),
      sentAt: new Date(),
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 3,
    });

    const sent = await service.transitionStatus(
      tenantId,
      'comm-1',
      { status: 'sent' },
      2,
    );
    expect(sent.ok).toBe(true);
    expect(recordRepository.update).toHaveBeenLastCalledWith(
      tenantId,
      'comm-1',
      expect.objectContaining({ status: 'sent', sentAt: expect.any(Date) }),
      2,
    );
  });

  it('rejects invalid transitions', async () => {
    recordRepository.findById.mockResolvedValue({
      id: 'comm-1',
      deletedAt: null,
      status: 'draft',
      channel: 'email',
      version: 1,
    });

    const result = await service.transitionStatus(
      tenantId,
      'comm-1',
      { status: 'sent' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('allows draft → completed for manual channels only', async () => {
    recordRepository.findById.mockResolvedValue({
      id: 'comm-1',
      deletedAt: null,
      status: 'draft',
      channel: 'internal_note',
      version: 1,
    });
    recordRepository.update.mockResolvedValue({
      id: 'comm-1',
      tenantId,
      bookingId: null,
      customerId: null,
      vendorId: null,
      staffMemberId: null,
      templateId: null,
      channel: 'internal_note',
      direction: 'outgoing',
      status: 'completed',
      subject: null,
      body: 'note',
      failureReason: null,
      createdByUserId: null,
      occurredAt: new Date(),
      sentAt: null,
      deliveredAt: null,
      readAt: null,
      failedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const ok = await service.transitionStatus(
      tenantId,
      'comm-1',
      { status: 'completed' },
      1,
    );
    expect(ok.ok).toBe(true);

    recordRepository.findById.mockResolvedValue({
      id: 'comm-2',
      deletedAt: null,
      status: 'draft',
      channel: 'sms',
      version: 1,
    });
    const bad = await service.transitionStatus(
      tenantId,
      'comm-2',
      { status: 'completed' },
      1,
    );
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
