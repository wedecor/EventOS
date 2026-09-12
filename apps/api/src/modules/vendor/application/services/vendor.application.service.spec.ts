import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  VendorCreatedEvent,
  VendorIssueNoteAddedEvent,
  VendorStatusChangedEvent,
  VendorUpdatedEvent,
} from '../../../../shared/events/sprint4-domain.events';
import { VendorApplicationService } from './vendor.application.service';
import type {
  VendorIssueNoteRecord,
  VendorIssueNoteRepository,
} from '../../domain/repositories/vendor-issue-note.repository';
import type {
  VendorRecord,
  VendorRepository,
} from '../../domain/repositories/vendor.repository';

describe('VendorApplicationService', () => {
  const tenantId = 'tenant-1';
  const vendorId = 'vendor-1';

  const baseVendor: VendorRecord = {
    id: vendorId,
    tenantId,
    name: 'Blossom Flowers',
    category: 'fresh_flowers',
    status: 'active',
    contactName: 'Ramesh',
    contactPhone: '+919000000000',
    location: 'JP Nagar',
    servicesProvided: 'Fresh flower supply',
    pricingNotes: null,
    paymentTerms: null,
    taxDetails: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseIssueNote: VendorIssueNoteRecord = {
    id: 'issue-note-1',
    tenantId,
    vendorId,
    message: 'Repeated late delivery.',
    severity: 'medium',
    occurredAt: null,
    createdAt: new Date(),
  };

  let vendorRepository: jest.Mocked<VendorRepository>;
  let vendorIssueNoteRepository: jest.Mocked<VendorIssueNoteRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: VendorApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    vendorRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    };
    vendorIssueNoteRepository = {
      create: jest.fn(),
      findByVendorId: jest.fn(),
    };
    eventPublisher = { publish };

    service = new VendorApplicationService(
      vendorRepository,
      vendorIssueNoteRepository,
      eventPublisher,
    );
  });

  // ── createVendor ─────────────────────────────────────────────────────

  it('createVendor rejects blank name', async () => {
    const result = await service.createVendor(tenantId, {
      name: '   ',
      category: 'fresh_flowers',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(vendorRepository.create).not.toHaveBeenCalled();
  });

  it('createVendor rejects blank category', async () => {
    const result = await service.createVendor(tenantId, {
      name: 'Blossom Flowers',
      category: '',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createVendor creates a vendor and publishes VendorCreated', async () => {
    vendorRepository.create.mockResolvedValue(baseVendor);

    const result = await service.createVendor(tenantId, {
      name: 'Blossom Flowers',
      category: 'fresh_flowers',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(vendorId);
      expect(result.value.status).toBe('active');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(VendorCreatedEvent));
  });

  // ── getVendorById / listVendors ──────────────────────────────────────

  it('getVendorById returns NOT_FOUND when missing', async () => {
    vendorRepository.findById.mockResolvedValue(null);

    const result = await service.getVendorById(tenantId, vendorId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('listVendors returns vendors from the repository', async () => {
    vendorRepository.findMany.mockResolvedValue([baseVendor]);

    const result = await service.listVendors(tenantId, { status: 'active' });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
    expect(vendorRepository.findMany).toHaveBeenCalledWith(tenantId, {
      status: 'active',
    });
  });

  // ── updateVendor ─────────────────────────────────────────────────────

  it('updateVendor rejects when vendor not found', async () => {
    vendorRepository.findById.mockResolvedValue(null);

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { name: 'New Name' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateVendor requires a reason when changing status to blocked', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { status: 'blocked' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(vendorRepository.update).not.toHaveBeenCalled();
  });

  it('updateVendor requires a reason when changing status to paused', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { status: 'paused' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateVendor allows status change to preferred without a reason', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorRepository.update.mockResolvedValue({
      ...baseVendor,
      status: 'preferred',
      version: 2,
    });

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { status: 'preferred' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('preferred');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(VendorStatusChangedEvent));
  });

  it('updateVendor blocks vendor with reason and records a VendorIssueNote', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorRepository.update.mockResolvedValue({
      ...baseVendor,
      status: 'blocked',
      version: 2,
    });
    vendorIssueNoteRepository.create.mockResolvedValue(baseIssueNote);

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { status: 'blocked', statusReason: 'Repeated quality issues.' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('blocked');
    }
    expect(vendorIssueNoteRepository.create).toHaveBeenCalledWith(
      tenantId,
      vendorId,
      { message: 'Repeated quality issues.', severity: 'high' },
    );
    expect(publish).toHaveBeenCalledWith(expect.any(VendorStatusChangedEvent));
    expect(publish).toHaveBeenCalledWith(expect.any(VendorIssueNoteAddedEvent));
  });

  it('updateVendor publishes VendorUpdated when status is unchanged', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorRepository.update.mockResolvedValue({
      ...baseVendor,
      contactPhone: '+919999999999',
      version: 2,
    });

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { contactPhone: '+919999999999' },
      1,
    );

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(VendorUpdatedEvent));
  });

  it('updateVendor handles ConcurrentModificationError', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Vendor', vendorId),
    );

    const result = await service.updateVendor(
      tenantId,
      vendorId,
      { notes: 'update' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── addIssueNote ─────────────────────────────────────────────────────

  it('addIssueNote rejects when vendor not found', async () => {
    vendorRepository.findById.mockResolvedValue(null);

    const result = await service.addIssueNote(tenantId, vendorId, {
      message: 'Issue',
      severity: 'low',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addIssueNote rejects blank message', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);

    const result = await service.addIssueNote(tenantId, vendorId, {
      message: '   ',
      severity: 'low',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(vendorIssueNoteRepository.create).not.toHaveBeenCalled();
  });

  it('addIssueNote creates a note and publishes VendorIssueNoteAdded', async () => {
    vendorRepository.findById.mockResolvedValue(baseVendor);
    vendorIssueNoteRepository.create.mockResolvedValue(baseIssueNote);

    const result = await service.addIssueNote(tenantId, vendorId, {
      message: 'Repeated late delivery.',
      severity: 'medium',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('issue-note-1');
    }
    expect(publish).toHaveBeenCalledWith(expect.any(VendorIssueNoteAddedEvent));
  });
});
