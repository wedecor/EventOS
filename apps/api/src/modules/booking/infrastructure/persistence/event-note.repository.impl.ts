import { Injectable } from '@nestjs/common';
import type { EventNote } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateEventNoteData,
  EventNoteRecord,
  EventNoteRepository,
} from '../../domain/repositories/event-note.repository';

@Injectable()
export class EventNoteRepositoryImpl
  extends TenantScopedRepository
  implements EventNoteRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateEventNoteData,
  ): Promise<EventNoteRecord> {
    const note = await this.prisma.eventNote.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        createdBy: { connect: { id: data.createdByUserId } },
        body: data.body,
      },
    });

    return this.mapRecord(note);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<EventNoteRecord | null> {
    const note = await this.prisma.eventNote.findFirst({
      where: { id, tenantId },
    });

    return note ? this.mapRecord(note) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<EventNoteRecord[]> {
    const notes = await this.prisma.eventNote.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return notes.map((note) => this.mapRecord(note));
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.prisma.eventNote.deleteMany({
      where: { id, tenantId },
    });
  }

  private mapRecord(note: EventNote): EventNoteRecord {
    return {
      id: note.id,
      tenantId: note.tenantId,
      bookingId: note.bookingId,
      body: note.body,
      createdByUserId: note.createdByUserId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      version: note.version,
    };
  }
}
