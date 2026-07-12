export type InventoryMovementDamageNoteRecord = {
  id: string;
  tenantId: string;
  movementId: string;
  message: string;
  accountability: string | null;
  occurredAt: Date | null;
  createdAt: Date;
};

export type CreateInventoryMovementDamageNoteData = {
  message: string;
  accountability?: string | null;
  occurredAt?: Date | null;
};

export abstract class InventoryMovementDamageNoteRepository {
  abstract create(
    tenantId: string,
    movementId: string,
    data: CreateInventoryMovementDamageNoteData,
  ): Promise<InventoryMovementDamageNoteRecord>;

  abstract findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryMovementDamageNoteRecord[]>;
}
