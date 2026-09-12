import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  DamageNoteAddedEvent,
  InventoryMovementPlannedEvent,
  InventoryMovementStateChangedEvent,
} from '../../../../shared/events/sprint3-domain.events';
import { InventoryMovementApplicationService } from './inventory-movement.application.service';
import type {
  InventoryMovementDamageNoteRecord,
  InventoryMovementDamageNoteRepository,
} from '../../domain/repositories/inventory-movement-damage-note.repository';
import type {
  InventoryMovementRecord,
  InventoryMovementRepository,
} from '../../domain/repositories/inventory-movement.repository';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';

describe('InventoryMovementApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const inventoryItemId = 'item-1';
  const movementId = 'movement-1';

  const baseBooking: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_preparation',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    workspaceStatus: 'active',
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseMovement: InventoryMovementRecord = {
    id: movementId,
    tenantId,
    bookingId,
    inventoryItemId,
    quantity: 2,
    notes: null,
    status: 'planned',
    pickedAt: null,
    packedAt: null,
    loadedAt: null,
    atVenueAt: null,
    returnedAt: null,
    cleanedReadyAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseDamageNote: InventoryMovementDamageNoteRecord = {
    id: 'damage-note-1',
    tenantId,
    movementId,
    message: 'Backdrop frame bent during transport.',
    accountability: null,
    occurredAt: null,
    createdAt: new Date(),
  };

  let movementRepository: jest.Mocked<InventoryMovementRepository>;
  let damageNoteRepository: jest.Mocked<InventoryMovementDamageNoteRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: InventoryMovementApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    movementRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    };
    damageNoteRepository = {
      create: jest.fn(),
      findByMovementId: jest.fn(),
    };
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new InventoryMovementApplicationService(
      movementRepository,
      damageNoteRepository,
      eventRepository,
      eventPublisher,
    );
  });

  // ── createMovement ───────────────────────────────────────────────────

  it('createMovement rejects when booking not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createMovement(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('createMovement rejects when booking is cancelled', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseBooking,
      status: 'cancelled',
    });

    const result = await service.createMovement(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('createMovement rejects non-positive quantity', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);

    const result = await service.createMovement(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(movementRepository.create).not.toHaveBeenCalled();
  });

  it('createMovement creates movement in planned status and publishes InventoryMovementPlanned', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    movementRepository.create.mockResolvedValue(baseMovement);

    const result = await service.createMovement(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(movementId);
      expect(result.value.status).toBe('planned');
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(InventoryMovementPlannedEvent),
    );
  });

  it('createMovement passes all fields to repository', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    movementRepository.create.mockResolvedValue(baseMovement);

    await service.createMovement(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 3,
      notes: 'Fragile — handle with care',
    });

    expect(movementRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 3,
      notes: 'Fragile — handle with care',
    });
  });

  // ── getMovementById ──────────────────────────────────────────────────

  it('getMovementById returns NOT_FOUND when missing', async () => {
    movementRepository.findById.mockResolvedValue(null);

    const result = await service.getMovementById(tenantId, movementId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('getMovementById returns the movement when found', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);

    const result = await service.getMovementById(tenantId, movementId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(movementId);
    }
  });

  // ── listMovementsForBooking ──────────────────────────────────────────

  it('listMovementsForBooking returns empty array when none exist', async () => {
    movementRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listMovementsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('listMovementsForBooking returns movements for the booking', async () => {
    movementRepository.findByBookingId.mockResolvedValue([baseMovement]);

    const result = await service.listMovementsForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(movementId);
    }
  });

  // ── transitionMovement ───────────────────────────────────────────────

  it('transitionMovement rejects when movement not found', async () => {
    movementRepository.findById.mockResolvedValue(null);

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'picked' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('transitionMovement rejects skipping a state (planned -> loaded)', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'loaded' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
    expect(movementRepository.update).not.toHaveBeenCalled();
  });

  it('transitionMovement rejects transition from a terminal state', async () => {
    movementRepository.findById.mockResolvedValue({
      ...baseMovement,
      status: 'cleaned_ready',
    });

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'picked' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('transitionMovement transitions planned -> picked and sets pickedAt', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);
    movementRepository.update.mockResolvedValue({
      ...baseMovement,
      status: 'picked',
      pickedAt: new Date(),
      version: 2,
    });

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'picked' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('picked');
      expect(result.value.pickedAt).not.toBeNull();
    }
    expect(movementRepository.update).toHaveBeenCalledWith(
      tenantId,
      movementId,
      {
        status: 'picked',
        notes: undefined,
        pickedAt: expect.any(Date),
      },
      1,
    );
    expect(publish).toHaveBeenCalledWith(
      expect.any(InventoryMovementStateChangedEvent),
    );
  });

  it('transitionMovement uses a caller-supplied occurredAt timestamp', async () => {
    const occurredAt = new Date('2026-08-01T09:00:00.000Z');
    movementRepository.findById.mockResolvedValue({
      ...baseMovement,
      status: 'picked',
      pickedAt: new Date(),
    });
    movementRepository.update.mockResolvedValue({
      ...baseMovement,
      status: 'packed',
      packedAt: occurredAt,
      version: 2,
    });

    await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'packed', occurredAt },
      1,
    );

    expect(movementRepository.update).toHaveBeenCalledWith(
      tenantId,
      movementId,
      { status: 'packed', notes: undefined, packedAt: occurredAt },
      1,
    );
  });

  it('transitionMovement allows the full linear lifecycle through cleaned_ready', async () => {
    movementRepository.findById.mockResolvedValue({
      ...baseMovement,
      status: 'returned',
    });
    movementRepository.update.mockResolvedValue({
      ...baseMovement,
      status: 'cleaned_ready',
      cleanedReadyAt: new Date(),
      version: 2,
    });

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'cleaned_ready' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('cleaned_ready');
    }
  });

  it('transitionMovement handles ConcurrentModificationError', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);
    movementRepository.update.mockRejectedValue(
      new ConcurrentModificationError('InventoryMovement', movementId),
    );

    const result = await service.transitionMovement(
      tenantId,
      movementId,
      { toStatus: 'picked' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  // ── addDamageNote ────────────────────────────────────────────────────

  it('addDamageNote rejects when movement not found', async () => {
    movementRepository.findById.mockResolvedValue(null);

    const result = await service.addDamageNote(tenantId, movementId, {
      message: 'Damaged in transit',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addDamageNote rejects blank message', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);

    const result = await service.addDamageNote(tenantId, movementId, {
      message: '   ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(damageNoteRepository.create).not.toHaveBeenCalled();
  });

  it('addDamageNote creates a note and publishes DamageNoteAdded', async () => {
    movementRepository.findById.mockResolvedValue(baseMovement);
    damageNoteRepository.create.mockResolvedValue(baseDamageNote);

    const result = await service.addDamageNote(tenantId, movementId, {
      message: 'Backdrop frame bent during transport.',
      accountability: 'Loading crew',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe('damage-note-1');
      expect(result.value.message).toBe(
        'Backdrop frame bent during transport.',
      );
    }
    expect(damageNoteRepository.create).toHaveBeenCalledWith(
      tenantId,
      movementId,
      {
        message: 'Backdrop frame bent during transport.',
        accountability: 'Loading crew',
        occurredAt: undefined,
      },
    );
    expect(publish).toHaveBeenCalledWith(expect.any(DamageNoteAddedEvent));
  });
});
