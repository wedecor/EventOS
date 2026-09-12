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
import { InventoryMovementDamageNoteRepository } from '../../domain/repositories/inventory-movement-damage-note.repository';
import {
  InventoryMovementRepository,
  type InventoryMovementRecord,
  type UpdateInventoryMovementData,
} from '../../domain/repositories/inventory-movement.repository';
import {
  toInventoryMovementDamageNoteDto,
  type InventoryMovementDamageNoteDto,
} from '../dtos/inventory-movement-damage-note.dto';
import {
  toInventoryMovementDto,
  type InventoryMovementDto,
} from '../dtos/inventory-movement.dto';

export type CreateInventoryMovementInput = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string | null;
};

export type TransitionInventoryMovementInput = {
  toStatus: InventoryMovementRecord['status'];
  occurredAt?: Date | null;
  notes?: string | null;
};

export type AddDamageNoteInput = {
  message: string;
  accountability?: string | null;
  occurredAt?: Date | null;
};

type MovementStatus = InventoryMovementRecord['status'];

// EP1-INV-003, EP1-INV-005 — Movement Workflow (Phase 1 Requirement), `docs/business/08-inventory-workflow.md`
// §11: Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned/Ready (linear; no shortcuts).
const ALLOWED_TRANSITIONS: Record<MovementStatus, MovementStatus[]> = {
  planned: ['picked'],
  picked: ['packed'],
  packed: ['loaded'],
  loaded: ['at_venue'],
  at_venue: ['returned'],
  returned: ['cleaned_ready'],
  cleaned_ready: [],
};

function timestampUpdateFor(
  toStatus: MovementStatus,
  occurredAt: Date,
): Pick<
  UpdateInventoryMovementData,
  | 'pickedAt'
  | 'packedAt'
  | 'loadedAt'
  | 'atVenueAt'
  | 'returnedAt'
  | 'cleanedReadyAt'
> {
  switch (toStatus) {
    case 'picked':
      return { pickedAt: occurredAt };
    case 'packed':
      return { packedAt: occurredAt };
    case 'loaded':
      return { loadedAt: occurredAt };
    case 'at_venue':
      return { atVenueAt: occurredAt };
    case 'returned':
      return { returnedAt: occurredAt };
    case 'cleaned_ready':
      return { cleanedReadyAt: occurredAt };
    default:
      return {};
  }
}

// EP1-INV-003, EP1-INV-005, EP1-INV-006 — Event-linked inventory movement; state transitions are
// human-initiated direct commands (ADR-017), consistent with `WorkspaceService.activateWorkspace()`
// and `StaffAssignmentApplicationService` precedent. `InventoryItem` master (EP1-INV-001/002) and
// `PackingList` generation (EP1-INV-004, Suggestion-gated) are out of scope for Sprint 3.
@Injectable()
export class InventoryMovementApplicationService {
  constructor(
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly damageNoteRepository: InventoryMovementDamageNoteRepository,
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

    const movement = await this.inventoryMovementRepository.create(tenantId, {
      bookingId: input.bookingId,
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      notes: input.notes,
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

  // EP1-INV-003 — Inventory movement visibility for a booking (Event Workspace integration)
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

  // EP1-INV-003, EP1-INV-005 — Human-initiated state transition (no auto-progression)
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
          ...timestampUpdateFor(input.toStatus, occurredAt),
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

  // EP1-INV-006 — Damage/loss accountability note
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
    const allowed = ALLOWED_TRANSITIONS[from];
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
