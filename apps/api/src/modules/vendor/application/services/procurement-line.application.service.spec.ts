import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ProcurementLineIssueNoteAddedEvent,
  ProcurementLinePlannedEvent,
  ProcurementLineStatusChangedEvent,
} from '../../../../shared/events/sprint4-domain.events';
import type { QuotationLineItemRepository } from '../../../quotation/domain/repositories/quotation-line-item.repository';
import type {
  ProcurementLineIssueNoteRecord,
  ProcurementLineIssueNoteRepository,
} from '../../domain/repositories/procurement-line-issue-note.repository';
import type {
  ProcurementLineRecord,
  ProcurementLineRepository,
} from '../../domain/repositories/procurement-line.repository';
import type {
  VendorProcurementRecord,
  VendorProcurementRepository,
} from '../../domain/repositories/vendor-procurement.repository';
import { ProcurementLineApplicationService } from './procurement-line.application.service';

describe('ProcurementLineApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const procurementId = 'procurement-1';
  const lineId = 'line-1';

  const baseProcurement: VendorProcurementRecord = {
    id: procurementId,
    tenantId,
    bookingId,
    vendorId: 'vendor-1',
    status: 'planned',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseLine: ProcurementLineRecord = {
    id: lineId,
    tenantId,
    vendorProcurementId: procurementId,
    bookingId,
    quotationLineItemId: null,
    description: 'Fresh flowers for stage',
    category: 'fresh_flowers',
    quantity: 1,
    budgetedAmount: 10000,
    actualAmount: null,
    currency: 'INR',
    status: 'planned',
    requestedAt: null,
    confirmedAt: null,
    deliveredAt: null,
    completedAt: null,
    costVarianceAmount: null,
    costVarianceReason: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseIssueNote: ProcurementLineIssueNoteRecord = {
    id: 'issue-note-1',
    tenantId,
    procurementLineId: lineId,
    message: 'Wrong flower variety delivered.',
    severity: 'medium',
    occurredAt: null,
    createdAt: new Date(),
  };

  let procurementLineRepository: jest.Mocked<ProcurementLineRepository>;
  let vendorProcurementRepository: jest.Mocked<VendorProcurementRepository>;
  let issueNoteRepository: jest.Mocked<ProcurementLineIssueNoteRepository>;
  let quotationLineItemRepository: jest.Mocked<QuotationLineItemRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: ProcurementLineApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    procurementLineRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByVendorProcurementId: jest.fn(),
      update: jest.fn(),
    };
    vendorProcurementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
    };
    issueNoteRepository = {
      create: jest.fn(),
      findByProcurementLineId: jest.fn(),
    };
    quotationLineItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      countByQuotationId: jest.fn(),
    };
    eventPublisher = { publish };

    service = new ProcurementLineApplicationService(
      procurementLineRepository,
      vendorProcurementRepository,
      issueNoteRepository,
      quotationLineItemRepository,
      eventPublisher,
    );
  });

  // ── addLine ──────────────────────────────────────────────────────────

  it('addLine rejects when vendor procurement not found', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(null);

    const result = await service.addLine(tenantId, procurementId, {
      description: 'Flowers',
      category: 'fresh_flowers',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addLine rejects blank description', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);

    const result = await service.addLine(tenantId, procurementId, {
      description: '   ',
      category: 'fresh_flowers',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(procurementLineRepository.create).not.toHaveBeenCalled();
  });

  it('addLine rejects non-positive quantity', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);

    const result = await service.addLine(tenantId, procurementId, {
      description: 'Flowers',
      category: 'fresh_flowers',
      quantity: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('addLine rejects when linked quotation line item is not found', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);
    quotationLineItemRepository.findById.mockResolvedValue(null);

    const result = await service.addLine(tenantId, procurementId, {
      description: 'Flowers',
      category: 'fresh_flowers',
      quotationLineItemId: 'quote-line-1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addLine creates a planned line and publishes ProcurementLinePlanned', async () => {
    vendorProcurementRepository.findById.mockResolvedValue(baseProcurement);
    procurementLineRepository.create.mockResolvedValue(baseLine);

    const result = await service.addLine(tenantId, procurementId, {
      description: 'Fresh flowers for stage',
      category: 'fresh_flowers',
      budgetedAmount: 10000,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(lineId);
      expect(result.value.status).toBe('planned');
    }
    expect(procurementLineRepository.create).toHaveBeenCalledWith(
      tenantId,
      procurementId,
      bookingId,
      {
        description: 'Fresh flowers for stage',
        category: 'fresh_flowers',
        quantity: undefined,
        budgetedAmount: 10000,
        currency: undefined,
        quotationLineItemId: undefined,
        notes: undefined,
      },
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(ProcurementLinePlannedEvent),
    );
  });

  // ── transitionLine ───────────────────────────────────────────────────

  it('transitionLine rejects when line not found', async () => {
    procurementLineRepository.findById.mockResolvedValue(null);

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'requested' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('transitionLine rejects skipping a state (planned -> confirmed)', async () => {
    procurementLineRepository.findById.mockResolvedValue(baseLine);

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'confirmed' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
    expect(procurementLineRepository.update).not.toHaveBeenCalled();
  });

  it('transitionLine rejects transition from a terminal state', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'completed',
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'delivered' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('transitionLine transitions planned -> requested and sets requestedAt', async () => {
    procurementLineRepository.findById.mockResolvedValue(baseLine);
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'requested',
      requestedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'requested' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('requested');
      expect(result.value.requestedAt).not.toBeNull();
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(ProcurementLineStatusChangedEvent),
    );
  });

  it('transitionLine allows confirmed -> delivered directly (material-only categories)', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'confirmed',
    });
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'delivered',
      deliveredAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'delivered' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('delivered');
    }
  });

  it('transitionLine allows confirmed -> completed directly (service-only categories)', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'confirmed',
    });
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'completed',
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'completed' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('completed');
    }
  });

  it('transitionLine allows delivered -> completed (both-checkpoint categories)', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'delivered',
      deliveredAt: new Date(),
    });
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'completed',
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'completed' },
      1,
    );

    expect(result.ok).toBe(true);
  });

  it('transitionLine requires a variance reason when actual exceeds budget', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'confirmed',
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'completed', actualAmount: 12000 },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(procurementLineRepository.update).not.toHaveBeenCalled();
  });

  it('transitionLine records cost variance amount + reason when actual exceeds budget', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'confirmed',
    });
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'completed',
      actualAmount: 12000,
      costVarianceAmount: 2000,
      costVarianceReason: 'market_price_increase',
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      {
        toStatus: 'completed',
        actualAmount: 12000,
        costVarianceReason: 'market_price_increase',
      },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.costVarianceAmount).toBe(2000);
      expect(result.value.costVarianceReason).toBe('market_price_increase');
    }
    expect(procurementLineRepository.update).toHaveBeenCalledWith(
      tenantId,
      lineId,
      expect.objectContaining({
        actualAmount: 12000,
        costVarianceAmount: 2000,
        costVarianceReason: 'market_price_increase',
      }),
      1,
    );
  });

  it('transitionLine does not require a reason when actual is within budget', async () => {
    procurementLineRepository.findById.mockResolvedValue({
      ...baseLine,
      status: 'confirmed',
    });
    procurementLineRepository.update.mockResolvedValue({
      ...baseLine,
      status: 'completed',
      actualAmount: 8000,
      costVarianceAmount: -2000,
      costVarianceReason: null,
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'completed', actualAmount: 8000 },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.costVarianceReason).toBeNull();
    }
  });

  it('transitionLine handles ConcurrentModificationError', async () => {
    procurementLineRepository.findById.mockResolvedValue(baseLine);
    procurementLineRepository.update.mockRejectedValue(
      new ConcurrentModificationError('ProcurementLine', lineId),
    );

    const result = await service.transitionLine(
      tenantId,
      lineId,
      { toStatus: 'requested' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── addIssueNote ─────────────────────────────────────────────────────

  it('addIssueNote rejects when line not found', async () => {
    procurementLineRepository.findById.mockResolvedValue(null);

    const result = await service.addIssueNote(tenantId, lineId, {
      message: 'Issue',
      severity: 'low',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addIssueNote rejects blank message', async () => {
    procurementLineRepository.findById.mockResolvedValue(baseLine);

    const result = await service.addIssueNote(tenantId, lineId, {
      message: '   ',
      severity: 'low',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(issueNoteRepository.create).not.toHaveBeenCalled();
  });

  it('addIssueNote creates a note and publishes ProcurementLineIssueNoteAdded', async () => {
    procurementLineRepository.findById.mockResolvedValue(baseLine);
    issueNoteRepository.create.mockResolvedValue(baseIssueNote);

    const result = await service.addIssueNote(tenantId, lineId, {
      message: 'Wrong flower variety delivered.',
      severity: 'medium',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('issue-note-1');
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(ProcurementLineIssueNoteAddedEvent),
    );
  });
});
