import { Injectable } from '@nestjs/common';
import type { InventoryMovementDamageNote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateInventoryMovementDamageNoteData,
  InventoryMovementDamageNoteRecord,
  InventoryMovementDamageNoteRepository,
} from '../../domain/repositories/inventory-movement-damage-note.repository';

@Injectable()
export class InventoryMovementDamageNoteRepositoryImpl
  extends TenantScopedRepository
  implements InventoryMovementDamageNoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    movementId: string,
    data: CreateInventoryMovementDamageNoteData,
  ): Promise<InventoryMovementDamageNoteRecord> {
    const note = await this.prisma.inventoryMovementDamageNote.create({
      data: {
        tenantId,
        movement: { connect: { id: movementId } },
        message: data.message,
        accountability: data.accountability ?? null,
        occurredAt: data.occurredAt ?? null,
      },
    });

    return this.mapRecord(note);
  }

  async findByMovementId(
    tenantId: string,
    movementId: string,
  ): Promise<InventoryMovementDamageNoteRecord[]> {
    const notes = await this.prisma.inventoryMovementDamageNote.findMany({
      where: { tenantId, movementId },
      orderBy: { createdAt: 'asc' },
    });

    return notes.map((note) => this.mapRecord(note));
  }

  private mapRecord(
    note: InventoryMovementDamageNote,
  ): InventoryMovementDamageNoteRecord {
    return {
      id: note.id,
      tenantId: note.tenantId,
      movementId: note.movementId,
      message: note.message,
      accountability: note.accountability,
      occurredAt: note.occurredAt,
      createdAt: note.createdAt,
    };
  }
}
