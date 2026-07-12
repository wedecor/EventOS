import { DomainEvent } from './domain-event.base';
import type { InventoryMovementRecord } from '../../modules/inventory/domain/repositories/inventory-movement.repository';
import type { InventoryMovementDamageNoteRecord } from '../../modules/inventory/domain/repositories/inventory-movement-damage-note.repository';

// EP1-INV-003 — Inventory movement planned for a booking
export class InventoryMovementPlannedEvent extends DomainEvent {
  readonly eventName = 'InventoryMovementPlanned';

  constructor(
    readonly tenantId: string,
    readonly movement: InventoryMovementRecord,
  ) {
    super();
  }
}

// EP1-INV-003, EP1-INV-005 — Inventory movement state transitioned (Picked/Packed/Loaded/At Venue/Returned/Cleaned-Ready)
export class InventoryMovementStateChangedEvent extends DomainEvent {
  readonly eventName = 'InventoryMovementStateChanged';

  constructor(
    readonly tenantId: string,
    readonly movement: InventoryMovementRecord,
    readonly fromStatus: InventoryMovementRecord['status'],
  ) {
    super();
  }
}

// EP1-INV-006 — Damage/loss accountability note added to a movement
export class DamageNoteAddedEvent extends DomainEvent {
  readonly eventName = 'DamageNoteAdded';

  constructor(
    readonly tenantId: string,
    readonly damageNote: InventoryMovementDamageNoteRecord,
  ) {
    super();
  }
}
