import { FinancialDocumentApplicationService } from './financial-document.application.service';

describe('FinancialDocumentApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';

  let service: FinancialDocumentApplicationService;
  let documentRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByBookingId: jest.Mock;
    findByPaymentId: jest.Mock;
    findByExpenseId: jest.Mock;
    update: jest.Mock;
  };
  let auditEventRepository: { create: jest.Mock; findByDocumentId: jest.Mock };
  let eventRepository: { findById: jest.Mock };
  let paymentRepository: { findById: jest.Mock };
  let expenseRepository: { findById: jest.Mock };
  let procurementRepository: { findById: jest.Mock };
  let invoiceRepository: { findById: jest.Mock };

  beforeEach(() => {
    documentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findByPaymentId: jest.fn(),
      findByExpenseId: jest.fn(),
      update: jest.fn(),
    };
    auditEventRepository = {
      create: jest.fn().mockResolvedValue({}),
      findByDocumentId: jest.fn(),
    };
    eventRepository = { findById: jest.fn() };
    paymentRepository = { findById: jest.fn() };
    expenseRepository = { findById: jest.fn() };
    procurementRepository = { findById: jest.fn() };
    invoiceRepository = { findById: jest.fn() };

    service = new FinancialDocumentApplicationService(
      documentRepository,
      auditEventRepository as never,
      eventRepository as never,
      paymentRepository as never,
      expenseRepository as never,
      procurementRepository as never,
      invoiceRepository as never,
    );
  });

  it('creates a payment proof with audit uploaded event', async () => {
    eventRepository.findById.mockResolvedValue({ id: bookingId });
    paymentRepository.findById.mockResolvedValue({
      id: 'pay-1',
      bookingId,
    });
    documentRepository.create.mockResolvedValue({
      id: 'doc-1',
      tenantId,
      bookingId,
      documentType: 'payment_proof',
      verificationStatus: 'pending',
      description: null,
      fileName: 'proof.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      storageKey: 'tenant/pay/proof.pdf',
      paymentId: 'pay-1',
      vendorExpenseId: null,
      vendorProcurementId: null,
      invoiceId: null,
      uploadedByUserId: 'user-1',
      uploadedAt: new Date(),
      verifiedByUserId: null,
      verifiedAt: null,
      verificationNotes: null,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.createDocument(tenantId, {
      bookingId,
      documentType: 'payment_proof',
      paymentId: 'pay-1',
      fileName: 'proof.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      storageKey: 'tenant/pay/proof.pdf',
      uploadedByUserId: 'user-1',
    });

    expect(result.ok).toBe(true);
    expect(auditEventRepository.create).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ eventType: 'uploaded' }),
    );
  });

  it('verifies a pending document', async () => {
    documentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      deletedAt: null,
      verificationStatus: 'pending',
      version: 1,
    });
    documentRepository.update.mockResolvedValue({
      id: 'doc-1',
      tenantId,
      bookingId,
      documentType: 'payment_proof',
      verificationStatus: 'verified',
      description: null,
      fileName: 'proof.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 1024,
      storageKey: null,
      paymentId: null,
      vendorExpenseId: null,
      vendorProcurementId: null,
      invoiceId: null,
      uploadedByUserId: null,
      uploadedAt: new Date(),
      verifiedByUserId: 'user-1',
      verifiedAt: new Date(),
      verificationNotes: 'ok',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.verifyDocument(
      tenantId,
      'doc-1',
      { verifiedByUserId: 'user-1', verificationNotes: 'ok' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.verificationStatus).toBe('verified');
    }
  });

  it('rejects verify when already verified', async () => {
    documentRepository.findById.mockResolvedValue({
      id: 'doc-1',
      deletedAt: null,
      verificationStatus: 'verified',
    });

    const result = await service.verifyDocument(
      tenantId,
      'doc-1',
      { verifiedByUserId: 'user-1' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });
});
