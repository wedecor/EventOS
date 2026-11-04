import { Injectable } from '@nestjs/common';
import type { IssueNoteSeverity } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { IssueNoteCreatedEvent } from '../../../../shared/events/sprint1-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { IssueNoteRepository } from '../../domain/repositories/issue-note.repository';
import {
  toIssueNoteCreateResultDto,
  type IssueNoteCreateResultDto,
} from '../dtos/issue-note.dto';

export type CreateIssueNoteInput = {
  message: string;
  severity: IssueNoteSeverity;
  notes?: string | null;
};

// R3-07 / EP1-CUS-004 — Create lightweight customer issue note for an event.
// docs/09 POST /events/:eventId/issues. customerId derived from Event (ADR-016).
@Injectable()
export class IssueApplicationService {
  constructor(
    private readonly issueNoteRepository: IssueNoteRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createIssueNote(
    tenantId: string,
    eventId: string,
    input: CreateIssueNoteInput,
  ): Promise<Result<IssueNoteCreateResultDto>> {
    const event = await this.eventRepository.findById(tenantId, eventId);
    if (!event) {
      return failure('NOT_FOUND', 'Event not found.');
    }

    if (!input.message.trim()) {
      return failure('VALIDATION_ERROR', 'Issue message cannot be blank.');
    }

    const note = await this.issueNoteRepository.create(tenantId, {
      eventId: event.id,
      customerId: event.customerId,
      message: input.message.trim(),
      severity: input.severity,
      notes: input.notes?.trim() || null,
    });

    this.eventPublisher.publish(new IssueNoteCreatedEvent(tenantId, note));

    return success(toIssueNoteCreateResultDto(note));
  }
}
