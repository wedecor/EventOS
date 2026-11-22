import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  DamageNoteAddedEvent,
  InventoryMovementPlannedEvent,
  InventoryMovementStateChangedEvent,
} from '../../../../shared/events/sprint3-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { InventoryItemRepository } from '../../domain/repositories/inventory-item.repository';
import { InventoryMovementDamageNoteRepository } from '../../domain/repositories/inventory-movement-damage-note.repository';
import {
  InventoryMovementRepository,
  type InventoryMovementRecord,
  type UpdateInventoryMovementData,
} from '../../domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from '../../domain/repositories/inventory-reservation.repository';
import {
  toInventoryMovementDamageNoteDto,
  type InventoryMovementDamageNoteDto,
} from '../dtos/inventory-movement-damage-note.dto';
import {
  toInventoryMovementDto,
  type InventoryMovementDto,
} from '../dtos/inventory-movement.dto';
import { InventoryAvailabilityService } from './inventory-availability.service';

export type CreateInventoryMovementInput = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string | null;
  reservationId?: string | null;
};

export type TransitionInventoryMovementInput = {
  toStatus: InventoryMovementRecord['status'];
  occurredAt?: Date | null;
  notes?: string | null;
  packedByUserId?: string | null;
  verificationNotes?: string | null;
  vehicle?: string | null;
  driverName?: string | null;
  returnedQuantity?: number | null;
  missingQuantity?: number | null;
  damagedQuantity?: number | null;
  returnVerificationNotes?: string | null;
};

export type AddDamageNoteInput = {
  message: string;
  accountability?: string | null;
  occurredAt?: Date | null;
};

type MovementStatus = InventoryMovementRecord['status'];

// Phase 1 linear path preserved; P2-07 adds packing/dispatch/return-verify branches.
const ALLOWED_TRANSITIONS: Record<MovementStatus, MovementStatus[]> = {
  planned: ['picked', 'cancelled'],
  picked: ['packing_started', 'packed', 'cancelled'],
  packing_started: ['packed', 'cancelled'],
  packed: ['verified', 'loaded', 'cancelled'],
  verified: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['loaded', 'cancelled'],
  loaded: ['dispatched', 'at_venue', 'cancelled'],
  dispatched: ['at_venue'],
  at_venue: ['returned'],
  returned: ['return_verified', 'cleaned_ready'],
  return_verified: ['cleaned_ready'],
  cleaned_ready: [],
  cancelled: [],
};

function timestampUpdateFor(
  toStatus: MovementStatus,
  occurredAt: Date,
  input: TransitionInventoryMovementInput,
): UpdateInventoryMovementData {
  const base: UpdateInventoryMovementData = {};

  switch (toStatus) {
    case 'picked':
      return { ...base, pickedAt: occurredAt };
    case 'packing_started':
      return { ...base, packingStartedAt: occurredAt };
    case 'packed':
      return {
        ...base,
        packedAt: occurredAt,
        packedByUserId: input.packedByUserId ?? undefined,
      };
    case 'verified':
      return {
        ...base,
        verifiedAt: occurredAt,
        verificationNotes: input.verificationNotes ?? undefined,
      };
    case 'ready_for_dispatch':
      return { ...base, readyForDispatchAt: occurredAt };
    case 'loaded':
      return {
        ...base,
        loadedAt: occurredAt,
        vehicle: input.vehicle ?? undefined,
        driverName: input.driverName ?? undefined,
      };
    case 'dispatched':
      return {
        ...base,
        dispatchedAt: occurredAt,
        vehicle: input.vehicle ?? undefined,
        driverName: input.driverName ?? undefined,
      };
    case 'at_venue':
      return { ...base, atVenueAt: occurredAt };
    case 'returned':
      return {
        ...base,
        returnedAt: occurredAt,
        returnedQuantity: input.returnedQuantity ?? undefined,
        missingQuantity: input.missingQuantity ?? undefined,
        damagedQuantity: input.damagedQuantity ?? undefined,
        returnVerificationNotes: input.returnVerificationNotes ?? undefined,
      };
    case 'return_verified':
      return {
        ...base,
        returnVerifiedAt: occurredAt,
        returnedQuantity: input.returnedQuantity ?? undefined,
        missingQuantity: input.missingQuantity ?? undefined,
        damagedQuantity: input.damagedQuantity ?? undefined,
        returnVerificationNotes: input.returnVerificationNotes ?? undefined,
      };
    case 'cleaned_ready':
      return { ...base, cleanedReadyAt: occurredAt };
    default:
      return base;
  }
}

@Injectable()
export class InventoryMovementApplicationService {
  constructor(
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly damageNoteRepository: InventoryMovementDamageNoteRepository,
    private readonly reservationRepository: InventoryReservationRepository,
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly availabilityService: InventoryAvailabilityService,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createMovement(
    tenantId: string,
    input: CreateInventoryMovementInput,
  ): Promise<Result<InventoryMovementDto>> {
    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot plan an inventory movement for a cancelled booking.',
        { bookingId: input.bookingId, status: booking.status },
      );
    }

    if (input.quantity <= 0) {
      return failure('VALIDATION_ERROR', 'Quantity must be greater than zero.');
    }

    const item = await this.inventoryItemRepository.findById(
      tenantId,
      input.inventoryItemId,
    );
    if (!item) {
      return failure('NOT_FOUND', 'Inventory item not found.');
    }

    if (input.reservationId) {
      const reservation = await this.reservationRepository.findById(
        tenantId,
        input.reservationId,
      );
      if (!reservation) {
        return failure('NOT_FOUND', 'Inventory reservation not found.');
      }
      if (reservation.status !== 'reserved') {
        return failure(
          'INVALID_STATE',
          'Can only create movements from active reservations.',
          { status: reservation.status },
        );
      }
      if (reservation.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Reservation booking must match movement booking.',
        );
      }
      if (reservation.inventoryItemId !== input.inventoryItemId) {
        return failure(
          'VALIDATION_ERROR',
          'Reservation inventory item must match movement item.',
        );
      }
      if (input.quantity > reservation.quantity) {
        return failure(
          'VALIDATION_ERROR',
          'Movement quantity cannot exceed reservation quantity.',
          {
            requested: input.quantity,
            reserved: reservation.quantity,
          },
        );
      }
    } else {
      const availability = await this.availabilityService.getAvailability(
        tenantId,
        input.inventoryItemId,
      );
      if (!availability || availability.availableQuantity < input.quantity) {
        return failure(
          'INSUFFICIENT_INVENTORY',
          'Not enough inventory available to plan this movement.',
          {
            inventoryItemId: input.inventoryItemId,
            requested: input.quantity,
            available: availability?.availableQuantity ?? 0,
          },
        );
      }
    }

    const movement = await this.inventoryMovementRepository.create(tenantId, {
      bookingId: input.bookingId,
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      notes: input.notes,
      reservationId: input.reservationId,
    });

    this.eventPublisher.publish(
      new InventoryMovementPlannedEvent(tenantId, movement),
    );

    return success(toInventoryMovementDto(movement));
  }

  async getMovementById(
    tenantId: string,
    movementId: string,
  ): Promise<Result<InventoryMovementDto>> {
    const movement = await this.inventoryMovementRepository.findById(
      tenantId,
      movementId,
    );
    if (!movement) {
      return failure('NOT_FOUND', 'Inventory movement not found.');
    }

    return success(toInventoryMovementDto(movement));
  }

  async listMovementsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<InventoryMovementDto[]>> {
    const movements = await this.inventoryMovementRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    return success(movements.map(toInventoryMovementDto));
  }

  async listAllMovements(
    tenantId: string,
  ): Promise<Result<InventoryMovementDto[]>> {
    const movements = await this.inventoryMovementRepository.findAll(tenantId);
    return success(movements.map(toInventoryMovementDto));
  }

  async transitionMovement(
    tenantId: string,
    movementId: string,
    input: TransitionInventoryMovementInput,
    version: number,
  ): Promise<Result<InventoryMovementDto>> {
    const existing = await this.inventoryMovementRepository.findById(
      tenantId,
      movementId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Inventory movement not found.');
    }

    const transition = this.checkTransition(existing.status, input.toStatus);
    if (transition) {
      return transition;
    }

    const occurredAt = input.occurredAt ?? new Date();

    try {
      const movement = await this.inventoryMovementRepository.update(
        tenantId,
        movementId,
        {
          status: input.toStatus,
          notes: input.notes,
          ...timestampUpdateFor(input.toStatus, occurredAt, input),
        },
        version,
      );

      this.eventPublisher.publish(
        new InventoryMovementStateChangedEvent(
          tenantId,
          movement,
          existing.status,
        ),
      );

      return success(toInventoryMovementDto(movement));
    } catch (error: unknown) {
      return this.handleConcurrency(error, movementId);
    }
  }

  async addDamageNote(
    tenantId: string,
    movementId: string,
    input: AddDamageNoteInput,
  ): Promise<Result<InventoryMovementDamageNoteDto>> {
    const movement = await this.inventoryMovementRepository.findById(
      tenantId,
      movementId,
    );
    if (!movement) {
      return failure('NOT_FOUND', 'Inventory movement not found.');
    }

    if (!input.message?.trim()) {
      return failure('VALIDATION_ERROR', 'Damage note message is required.');
    }

    const note = await this.damageNoteRepository.create(tenantId, movementId, {
      message: input.message,
      accountability: input.accountability,
      occurredAt: input.occurredAt,
    });

    this.eventPublisher.publish(new DamageNoteAddedEvent(tenantId, note));

    return success(toInventoryMovementDamageNoteDto(note));
  }

  private checkTransition(
    from: MovementStatus,
    to: MovementStatus,
  ): Result<InventoryMovementDto> | null {
    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition inventory movement from '${from}' to '${to}'.`,
        { from, to },
      );
    }

    return null;
  }

  private handleConcurrency<T>(error: unknown, movementId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Inventory movement was modified by another request. Reload and retry.',
        { movementId },
      );
    }

    throw error;
  }
}
