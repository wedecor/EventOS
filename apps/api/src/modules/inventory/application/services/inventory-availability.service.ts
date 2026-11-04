import { Injectable } from '@nestjs/common';
import { InventoryItemRepository } from '../../domain/repositories/inventory-item.repository';
import { InventoryMovementRepository } from '../../domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from '../../domain/repositories/inventory-reservation.repository';

export type InventoryAvailabilitySnapshot = {
  inventoryItemId: string;
  quantityAtJpNagar: number;
  reservedQuantity: number;
  unlinkedMovementQuantity: number;
  availableQuantity: number;
};

// P2-07 — available = quantityAtJpNagar − active reservations − unlinked active movements
@Injectable()
export class InventoryAvailabilityService {
  constructor(
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly reservationRepository: InventoryReservationRepository,
    private readonly movementRepository: InventoryMovementRepository,
  ) {}

  async getAvailability(
    tenantId: string,
    inventoryItemId: string,
    options?: { excludeReservationId?: string },
  ): Promise<InventoryAvailabilitySnapshot | null> {
    const item = await this.inventoryItemRepository.findById(
      tenantId,
      inventoryItemId,
    );
    if (!item) {
      return null;
    }

    const [reservations, unlinkedMovements] = await Promise.all([
      this.reservationRepository.findActiveByItemId(tenantId, inventoryItemId),
      this.movementRepository.findUnlinkedActiveByItemId(
        tenantId,
        inventoryItemId,
      ),
    ]);

    const reservedQuantity = reservations
      .filter((r) => r.id !== options?.excludeReservationId)
      .reduce((sum, r) => sum + r.quantity, 0);

    const unlinkedMovementQuantity = unlinkedMovements.reduce(
      (sum, m) => sum + m.quantity,
      0,
    );

    const availableQuantity = Math.max(
      0,
      item.quantityAtJpNagar - reservedQuantity - unlinkedMovementQuantity,
    );

    return {
      inventoryItemId,
      quantityAtJpNagar: item.quantityAtJpNagar,
      reservedQuantity,
      unlinkedMovementQuantity,
      availableQuantity,
    };
  }
}
