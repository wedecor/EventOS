import { WorkspaceActivityService } from './workspace-activity.service';

describe('WorkspaceActivityService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';

  let service: WorkspaceActivityService;
  let eventRepository: { findById: jest.Mock };
  let eventNoteRepository: { findByBookingId: jest.Mock };
  let taskRepository: { findByBookingId: jest.Mock };
  let staffAssignmentRepository: { findByBookingId: jest.Mock };
  let inventoryMovementRepository: { findByBookingId: jest.Mock };
  let inventoryReservationRepository: { findByBookingId: jest.Mock };
  let inventoryDamageReportRepository: { findByBookingId: jest.Mock };
  let vendorProcurementRepository: { findByBookingId: jest.Mock };
  let paymentRepository: { findByBookingId: jest.Mock };
  let timelineEventRepository: { findByBookingId: jest.Mock };
  let financialDocumentRepository: { findByBookingId: jest.Mock };
  let financialDocumentAuditEventRepository: {
    findByBookingDocumentIds: jest.Mock;
  };
  let communicationRecordRepository: { findByBookingId: jest.Mock };
  let reminderRepository: { findByBookingId: jest.Mock };

  beforeEach(() => {
    eventRepository = { findById: jest.fn() };
    eventNoteRepository = { findByBookingId: jest.fn() };
    taskRepository = { findByBookingId: jest.fn() };
    staffAssignmentRepository = { findByBookingId: jest.fn() };
    inventoryMovementRepository = { findByBookingId: jest.fn() };
    inventoryReservationRepository = { findByBookingId: jest.fn() };
    inventoryDamageReportRepository = { findByBookingId: jest.fn() };
    vendorProcurementRepository = { findByBookingId: jest.fn() };
    paymentRepository = { findByBookingId: jest.fn() };
    timelineEventRepository = { findByBookingId: jest.fn() };
    financialDocumentRepository = { findByBookingId: jest.fn() };
    financialDocumentAuditEventRepository = {
      findByBookingDocumentIds: jest.fn(),
    };
    communicationRecordRepository = { findByBookingId: jest.fn() };
    reminderRepository = { findByBookingId: jest.fn() };

    service = new WorkspaceActivityService(
      eventRepository as never,
      eventNoteRepository as never,
      taskRepository as never,
      staffAssignmentRepository as never,
      inventoryMovementRepository as never,
      inventoryReservationRepository as never,
      inventoryDamageReportRepository as never,
      vendorProcurementRepository as never,
      paymentRepository as never,
      timelineEventRepository as never,
      financialDocumentRepository as never,
      financialDocumentAuditEventRepository as never,
      communicationRecordRepository as never,
      reminderRepository as never,
    );
  });

  it('aggregates chronological activity including document events', async () => {
    const createdAt = new Date('2026-07-01T10:00:00Z');
    const completedAt = new Date('2026-07-02T10:00:00Z');

    eventRepository.findById.mockResolvedValue({
      id: bookingId,
      createdAt,
      updatedAt: createdAt,
      workspaceStatus: 'active',
      status: 'in_preparation',
      completedAt: null,
    });
    taskRepository.findByBookingId.mockResolvedValue([
      {
        id: 't1',
        title: 'Pack',
        status: 'completed',
        createdAt,
        completedAt,
      },
    ]);
    staffAssignmentRepository.findByBookingId.mockResolvedValue([]);
    inventoryMovementRepository.findByBookingId.mockResolvedValue([]);
    inventoryReservationRepository.findByBookingId.mockResolvedValue([]);
    inventoryDamageReportRepository.findByBookingId.mockResolvedValue([]);
    vendorProcurementRepository.findByBookingId.mockResolvedValue([]);
    paymentRepository.findByBookingId.mockResolvedValue([]);
    eventNoteRepository.findByBookingId.mockResolvedValue([]);
    timelineEventRepository.findByBookingId.mockResolvedValue([]);
    financialDocumentRepository.findByBookingId.mockResolvedValue([
      { id: 'doc-1' },
    ]);
    financialDocumentAuditEventRepository.findByBookingDocumentIds.mockResolvedValue(
      [
        {
          id: 'ae-1',
          eventType: 'uploaded',
          message: 'uploaded',
          financialDocumentId: 'doc-1',
          occurredAt: completedAt,
        },
      ],
    );
    communicationRecordRepository.findByBookingId.mockResolvedValue([
      {
        id: 'comm-1',
        createdAt,
        sentAt: completedAt,
        deliveredAt: null,
        readAt: null,
        failedAt: null,
      },
    ]);
    reminderRepository.findByBookingId.mockResolvedValue([
      {
        id: 'rem-1',
        title: 'Call client',
        createdAt,
        completedAt,
        cancelledAt: null,
      },
    ]);

    const result = await service.listActivity(tenantId, bookingId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const types = result.value.map((i) => i.type);
      expect(types).toContain('booking_created');
      expect(types).toContain('document_uploaded');
      expect(types).toContain('communication_created');
      expect(types).toContain('communication_sent');
      expect(types).toContain('reminder_created');
      expect(types).toContain('reminder_completed');
    }
  });
});
