import { WorkspaceProgressService } from './workspace-progress.service';

describe('WorkspaceProgressService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';

  let service: WorkspaceProgressService;
  let eventRepository: { findById: jest.Mock };
  let taskRepository: { findByBookingId: jest.Mock };
  let checklistItemRepository: { findByTaskId: jest.Mock };
  let eventChecklistItemRepository: { findByBookingId: jest.Mock };
  let staffAssignmentRepository: { findByBookingId: jest.Mock };
  let inventoryMovementRepository: { findByBookingId: jest.Mock };
  let damageNoteRepository: { findByMovementId: jest.Mock };
  let damageReportRepository: { findByBookingId: jest.Mock };
  let reservationRepository: { findByBookingId: jest.Mock };
  let vendorProcurementRepository: { findByBookingId: jest.Mock };
  let paymentRepository: { findByBookingId: jest.Mock };
  let financialDocumentRepository: { findByBookingId: jest.Mock };
  let communicationRecordRepository: { findByBookingId: jest.Mock };
  let reminderRepository: { findByBookingId: jest.Mock };

  beforeEach(() => {
    eventRepository = { findById: jest.fn() };
    taskRepository = { findByBookingId: jest.fn() };
    checklistItemRepository = { findByTaskId: jest.fn() };
    eventChecklistItemRepository = { findByBookingId: jest.fn() };
    staffAssignmentRepository = { findByBookingId: jest.fn() };
    inventoryMovementRepository = { findByBookingId: jest.fn() };
    damageNoteRepository = { findByMovementId: jest.fn() };
    damageReportRepository = { findByBookingId: jest.fn() };
    reservationRepository = { findByBookingId: jest.fn() };
    vendorProcurementRepository = { findByBookingId: jest.fn() };
    paymentRepository = { findByBookingId: jest.fn() };
    financialDocumentRepository = { findByBookingId: jest.fn() };
    communicationRecordRepository = { findByBookingId: jest.fn() };
    reminderRepository = { findByBookingId: jest.fn() };

    service = new WorkspaceProgressService(
      eventRepository as never,
      taskRepository as never,
      checklistItemRepository as never,
      eventChecklistItemRepository as never,
      staffAssignmentRepository as never,
      inventoryMovementRepository as never,
      damageNoteRepository as never,
      damageReportRepository as never,
      reservationRepository as never,
      vendorProcurementRepository as never,
      paymentRepository as never,
      financialDocumentRepository as never,
      communicationRecordRepository as never,
      reminderRepository as never,
    );
  });

  it('computes progress including finance document counters', async () => {
    eventRepository.findById.mockResolvedValue({ id: bookingId });
    taskRepository.findByBookingId.mockResolvedValue([
      { id: 't1', status: 'completed' },
      { id: 't2', status: 'pending' },
    ]);
    eventChecklistItemRepository.findByBookingId.mockResolvedValue([]);
    checklistItemRepository.findByTaskId
      .mockResolvedValueOnce([
        { id: 'c1', isCompleted: true },
        { id: 'c2', isCompleted: false },
      ])
      .mockResolvedValueOnce([{ id: 'c3', isCompleted: true }]);
    staffAssignmentRepository.findByBookingId.mockResolvedValue([
      { status: 'proposed' },
    ]);
    inventoryMovementRepository.findByBookingId.mockResolvedValue([
      { id: 'm1', status: 'planned' },
      { id: 'm2', status: 'packed' },
    ]);
    damageNoteRepository.findByMovementId.mockResolvedValue([]);
    damageReportRepository.findByBookingId.mockResolvedValue([]);
    reservationRepository.findByBookingId.mockResolvedValue([]);
    vendorProcurementRepository.findByBookingId.mockResolvedValue([
      { status: 'planned', workflowStatus: 'draft' },
    ]);
    paymentRepository.findByBookingId.mockResolvedValue([
      {
        id: 'pay-1',
        status: 'confirmed',
        attachmentId: null,
        missingProofReason: null,
      },
    ]);
    financialDocumentRepository.findByBookingId.mockResolvedValue([
      { paymentId: null, documentType: 'other', verificationStatus: 'pending' },
    ]);
    communicationRecordRepository.findByBookingId.mockResolvedValue([
      { status: 'failed' },
      { status: 'sent' },
    ]);
    reminderRepository.findByBookingId.mockResolvedValue([
      { status: 'pending', dueAt: new Date('2020-01-01T00:00:00Z') },
      { status: 'completed', dueAt: new Date('2020-01-01T00:00:00Z') },
    ]);

    const result = await service.getProgress(tenantId, bookingId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tasksComplete).toBe(1);
      expect(result.value.inventory.reserved).toBe(1);
      expect(result.value.financeDocuments.total).toBe(1);
      expect(result.value.financeDocuments.pendingVerification).toBe(1);
      expect(result.value.financeDocuments.missingPaymentProofs).toBe(1);
      expect(result.value.communications.total).toBe(2);
      expect(result.value.communications.failed).toBe(1);
      expect(result.value.communications.pendingReminders).toBe(1);
      expect(result.value.communications.overdueReminders).toBe(1);
      expect(result.value.communications.outstandingActions).toBe(2);
    }
  });

  it('returns NOT_FOUND when booking missing', async () => {
    eventRepository.findById.mockResolvedValue(null);
    const result = await service.getProgress(tenantId, bookingId);
    expect(result.ok).toBe(false);
  });
});
