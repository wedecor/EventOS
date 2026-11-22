import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../domain/repositories/event.repository';
import { EventNoteRepository } from '../../domain/repositories/event-note.repository';
import { toEventNoteDto, type EventNoteDto } from '../dtos/event-note.dto';

export type CreateEventNoteInput = {
  body: string;
  createdByUserId: string;
};

// P2-01 — Internal operational notes (not customer-visible)
@Injectable()
export class EventNoteApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventNoteRepository: EventNoteRepository,
  ) {}

  async listNotes(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<EventNoteDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const notes = await this.eventNoteRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    return success(notes.map(toEventNoteDto));
  }

  async createNote(
    tenantId: string,
    bookingId: string,
    input: CreateEventNoteInput,
  ): Promise<Result<EventNoteDto>> {
    if (input.body.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Note body is required.');
    }

    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot add notes to a cancelled booking.',
        { bookingId, status: booking.status },
      );
    }

    const note = await this.eventNoteRepository.create(tenantId, {
      bookingId,
      body: input.body.trim(),
      createdByUserId: input.createdByUserId,
    });

    return success(toEventNoteDto(note));
  }

  async deleteNote(
    tenantId: string,
    bookingId: string,
    noteId: string,
  ): Promise<Result<void>> {
    const note = await this.eventNoteRepository.findById(tenantId, noteId);
    if (!note || note.bookingId !== bookingId) {
      return failure('NOT_FOUND', 'Note not found.');
    }

    await this.eventNoteRepository.remove(tenantId, noteId);
    return success(undefined);
  }
}
