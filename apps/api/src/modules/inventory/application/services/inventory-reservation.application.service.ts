import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import { InventoryItemRepository } from '../../domain/repositories/inventory-item.repository';
import { InventoryReservationRepository } from '../../domain/repositories/inventory-reservation.repository';
import {
  toInventoryReservationDto,
  type InventoryReservationDto,
} from '../dtos/inventory-reservation.dto';
import { InventoryAvailabilityService } from './inventory-availability.service';

export type CreateInventoryReservationInput = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string | null;
  vendorProcurementId?: string | null;
};

export type ModifyInventoryReservationInput = {
  quantity?: number;
  notes?: string | null;
};

const COMPLETED_PROCUREMENT = new Set(['completed', 'materials_delivered']);

@Injectable()
export class InventoryReservationApplicationService {
  constructor(
    private readonly reservationRepository: InventoryReservationRepository,
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly eventRepository: EventRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly availabilityService: InventoryAvailabilityService,
  ) {}

  async createReservation(
    tenantId: string,
    input: CreateInventoryReservationInput,
  ): Promise<Result<InventoryReservationDto>> {
    if (input.quantity <= 0) {
      return failure('VALIDATION_ERROR', 'Quantity must be greater than zero.');
    }

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
        'Cannot reserve inventory for a cancelled booking.',
        { bookingId: input.bookingId },
      );
    }

    const item = await this.inventoryItemRepository.findById(
      tenantId,
      input.inventoryItemId,
    );
    if (!item) {
      return failure('NOT_FOUND', 'Inventory item not found.');
    }
    if (item.status !== 'active') {
      return failure(
        'INVALID_STATE',
        'Cannot reserve an inactive or retired inventory item.',
        { inventoryItemId: item.id, status: item.status },
      );
    }

    if (input.vendorProcurementId) {
      const procurement = await this.vendorProcurementRepository.findById(
        tenantId,
        input.vendorProcurementId,
      );
      if (!procurement) {
        return failure('NOT_FOUND', 'Vendor procurement not found.');
      }
      if (procurement.bookingId !== input.bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Procurement must belong to the same booking.',
          {
            bookingId: input.bookingId,
            procurementBookingId: procurement.bookingId,
          },
        );
      }
      if (!COMPLETED_PROCUREMENT.has(procurement.workflowStatus)) {
        return failure(
          'INVALID_STATE',
          'Only completed procurements can be associated with inventory reservations.',
          { workflowStatus: procurement.workflowStatus },
        );
      }
    }

    const availability = await this.availabilityService.getAvailability(
      tenantId,
      input.inventoryItemId,
    );
    if (!availability || availability.availableQuantity < input.quantity) {
      return failure(
        'INSUFFICIENT_INVENTORY',
        'Not enough inventory available to reserve.',
        {
          inventoryItemId: input.inventoryItemId,
          requested: input.quantity,
          available: availability?.availableQuantity ?? 0,
        },
      );
    }

    const reservation = await this.reservationRepository.create(tenantId, {
      bookingId: input.bookingId,
      inventoryItemId: input.inventoryItemId,
      quantity: input.quantity,
      notes: input.notes,
      vendorProcurementId: input.vendorProcurementId,
    });

    return success(toInventoryReservationDto(reservation));
  }

  async getReservationById(
    tenantId: string,
    id: string,
  ): Promise<Result<InventoryReservationDto>> {
    const reservation = await this.reservationRepository.findById(tenantId, id);
    if (!reservation) {
      return failure('NOT_FOUND', 'Inventory reservation not found.');
    }
    return success(toInventoryReservationDto(reservation));
  }

  async listReservationsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<InventoryReservationDto[]>> {
    const rows = await this.reservationRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(rows.map(toInventoryReservationDto));
  }

  async modifyReservation(
    tenantId: string,
    id: string,
    input: ModifyInventoryReservationInput,
    version: number,
  ): Promise<Result<InventoryReservationDto>> {
    const existing = await this.reservationRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Inventory reservation not found.');
    }
    if (existing.status !== 'reserved') {
      return failure(
        'INVALID_STATE',
        'Only active reservations can be modified.',
        { status: existing.status },
      );
    }

    const nextQuantity = input.quantity ?? existing.quantity;
    if (nextQuantity <= 0) {
      return failure('VALIDATION_ERROR', 'Quantity must be greater than zero.');
    }

    if (nextQuantity > existing.quantity) {
      const availability = await this.availabilityService.getAvailability(
        tenantId,
        existing.inventoryItemId,
        { excludeReservationId: existing.id },
      );
      if (!availability || availability.availableQuantity < nextQuantity) {
        return failure(
          'INSUFFICIENT_INVENTORY',
          'Not enough inventory available to increase reservation.',
          {
            inventoryItemId: existing.inventoryItemId,
            requested: nextQuantity,
            available: availability?.availableQuantity ?? 0,
          },
        );
      }
    }

    try {
      const updated = await this.reservationRepository.update(
        tenantId,
        id,
        {
          quantity: nextQuantity,
          notes: input.notes,
        },
        version,
      );
      return success(toInventoryReservationDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  async releaseReservation(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<InventoryReservationDto>> {
    return this.setTerminalStatus(tenantId, id, version, 'released');
  }

  async cancelReservation(
    tenantId: string,
    id: string,
    version: number,
  ): Promise<Result<InventoryReservationDto>> {
    return this.setTerminalStatus(tenantId, id, version, 'cancelled');
  }

  private async setTerminalStatus(
    tenantId: string,
    id: string,
    version: number,
    status: 'released' | 'cancelled',
  ): Promise<Result<InventoryReservationDto>> {
    const existing = await this.reservationRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Inventory reservation not found.');
    }
    if (existing.status !== 'reserved') {
      return failure(
        'INVALID_STATE',
        `Cannot ${status === 'released' ? 'release' : 'cancel'} a reservation that is already ${existing.status}.`,
        { status: existing.status },
      );
    }

    try {
      const updated = await this.reservationRepository.update(
        tenantId,
        id,
        { status },
        version,
      );
      return success(toInventoryReservationDto(updated));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  private handleConcurrency<T>(
    error: unknown,
    reservationId: string,
  ): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Inventory reservation was modified by another request. Reload and retry.',
        { reservationId },
      );
    }
    throw error;
  }
}
