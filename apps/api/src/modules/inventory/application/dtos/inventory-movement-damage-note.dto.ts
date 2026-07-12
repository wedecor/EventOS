import type { InventoryMovementDamageNoteRecord } from '../../domain/repositories/inventory-movement-damage-note.repository';

export type InventoryMovementDamageNoteDto = {
  id: string;
  tenantId: string;
  movementId: string;
  message: string;
  accountability: string | null;
  occurredAt: Date | null;
  createdAt: Date;
};

export function toInventoryMovementDamageNoteDto(
  record: InventoryMovementDamageNoteRecord,
): InventoryMovementDamageNoteDto {
  return { ...record };
}
