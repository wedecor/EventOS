import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { UserRepository } from '../../../platform/domain/repositories/user.repository';
import {
  SuggestionRepository,
  type SuggestionRecord,
} from '../../domain/repositories/suggestion.repository';

@Injectable()
export class SuggestionApplicationService {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly bookingApplicationService: BookingApplicationService,
    private readonly eventRepository: EventRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async listPending(tenantId: string): Promise<Result<SuggestionRecord[]>> {
    const suggestions = await this.suggestionRepository.listByStatus(
      tenantId,
      'pending',
    );

    return success(suggestions);
  }

  async queueWorkspaceCreate(
    tenantId: string,
    eventId: string,
  ): Promise<Result<SuggestionRecord>> {
    return this.queueSuggestion(
      tenantId,
      'Event',
      eventId,
      'workspace.create',
      { reason: 'EP1-AUT-002' },
    );
  }

  async queueChecklistGenerate(
    tenantId: string,
    eventId: string,
  ): Promise<Result<SuggestionRecord>> {
    return this.queueSuggestion(
      tenantId,
      'Event',
      eventId,
      'checklist.generate',
      { reason: 'EP1-AUT-003' },
    );
  }

  async queueStaffAssign(
    tenantId: string,
    eventId: string,
  ): Promise<Result<SuggestionRecord>> {
    return this.queueSuggestion(tenantId, 'Event', eventId, 'staff.assign', {
      reason: 'EP1-AUT-004',
    });
  }

  async acceptSuggestion(
    tenantId: string,
    suggestionId: string,
    input: { assigneeId?: string } = {},
  ): Promise<Result<SuggestionRecord>> {
    const suggestion = await this.suggestionRepository.findById(
      tenantId,
      suggestionId,
    );

    if (!suggestion) {
      return failure('NOT_FOUND', 'Suggestion not found.');
    }

    if (suggestion.status !== 'pending') {
      return failure('INVALID_STATE', 'Suggestion is not pending.', {
        status: suggestion.status,
      });
    }

    const execution = await this.executeAccept(tenantId, suggestion, input);
    if (!execution.ok) {
      return execution;
    }

    try {
      const updated = await this.suggestionRepository.updateStatus(
        tenantId,
        suggestionId,
        'accepted',
        suggestion.version,
      );
      return success(updated);
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Suggestion was modified by another request. Reload and retry.',
          { suggestionId },
        );
      }
      throw error;
    }
  }

  async dismissSuggestion(
    tenantId: string,
    suggestionId: string,
  ): Promise<Result<SuggestionRecord>> {
    const suggestion = await this.suggestionRepository.findById(
      tenantId,
      suggestionId,
    );

    if (!suggestion) {
      return failure('NOT_FOUND', 'Suggestion not found.');
    }

    if (suggestion.status !== 'pending') {
      return failure('INVALID_STATE', 'Suggestion is not pending.', {
        status: suggestion.status,
      });
    }

    try {
      const updated = await this.suggestionRepository.updateStatus(
        tenantId,
        suggestionId,
        'dismissed',
        suggestion.version,
      );
      return success(updated);
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Suggestion was modified by another request. Reload and retry.',
          { suggestionId },
        );
      }
      throw error;
    }
  }

  private async queueSuggestion(
    tenantId: string,
    aggregateType: string,
    aggregateId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<Result<SuggestionRecord>> {
    const existing = await this.suggestionRepository.findPendingByAggregate(
      tenantId,
      aggregateType,
      aggregateId,
      type,
    );

    if (existing) {
      return success(existing);
    }

    const suggestion = await this.suggestionRepository.create(tenantId, {
      type,
      aggregateType,
      aggregateId,
      payload,
    });

    return success(suggestion);
  }

  private async executeAccept(
    tenantId: string,
    suggestion: SuggestionRecord,
    input: { assigneeId?: string },
  ): Promise<Result<void>> {
    switch (suggestion.type) {
      case 'workspace.create':
        return this.executeWorkspaceCreate(tenantId, suggestion);
      case 'checklist.generate':
        return this.executeChecklistGenerate(tenantId, suggestion);
      case 'staff.assign':
        return this.executeStaffAssign(tenantId, suggestion, input);
      default:
        return failure(
          'NOT_IMPLEMENTED',
          `Accepting suggestion type "${suggestion.type}" is not supported.`,
          { type: suggestion.type },
        );
    }
  }

  private async executeWorkspaceCreate(
    tenantId: string,
    suggestion: SuggestionRecord,
  ): Promise<Result<void>> {
    if (suggestion.aggregateType !== 'Event') {
      return failure(
        'INVALID_STATE',
        'workspace.create suggestion must reference an Event.',
      );
    }

    const event = await this.eventRepository.findById(
      tenantId,
      suggestion.aggregateId,
    );

    if (!event) {
      return failure('NOT_FOUND', 'Linked booking not found.');
    }

    const activation = await this.bookingApplicationService.activateBooking(
      tenantId,
      event.id,
      { version: event.version },
    );

    if (!activation.ok) {
      return failure(
        activation.error.code,
        activation.error.message,
        activation.error.details,
      );
    }

    return success(undefined);
  }

  private async executeChecklistGenerate(
    tenantId: string,
    suggestion: SuggestionRecord,
  ): Promise<Result<void>> {
    if (suggestion.aggregateType !== 'Event') {
      return failure(
        'INVALID_STATE',
        'checklist.generate suggestion must reference an Event.',
      );
    }

    const event = await this.eventRepository.findById(
      tenantId,
      suggestion.aggregateId,
    );

    if (!event) {
      return failure('NOT_FOUND', 'Linked booking not found.');
    }

    if (event.status !== 'in_preparation') {
      return failure(
        'INVALID_STATE',
        'Checklist can only be generated for bookings in preparation.',
        { status: event.status },
      );
    }

    try {
      await this.eventRepository.update(
        tenantId,
        event.id,
        {
          preparationStatus: 'ready',
          operationalMilestone: 'checklist_draft',
        },
        event.version,
      );
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Booking was modified by another request. Reload and retry.',
          { bookingId: event.id },
        );
      }
      throw error;
    }

    return success(undefined);
  }

  private async executeStaffAssign(
    tenantId: string,
    suggestion: SuggestionRecord,
    input: { assigneeId?: string },
  ): Promise<Result<void>> {
    if (suggestion.aggregateType !== 'Event') {
      return failure(
        'INVALID_STATE',
        'staff.assign suggestion must reference an Event.',
      );
    }

    const assigneeId =
      input.assigneeId ??
      (typeof suggestion.payload?.assigneeId === 'string'
        ? suggestion.payload.assigneeId
        : undefined);
    if (typeof assigneeId !== 'string' || !assigneeId.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'staff.assign suggestion payload must include assigneeId.',
      );
    }

    const assignee = await this.userRepository.findById(
      tenantId,
      assigneeId.trim(),
    );

    if (!assignee) {
      return failure('NOT_FOUND', 'Assignee user not found.');
    }

    const event = await this.eventRepository.findById(
      tenantId,
      suggestion.aggregateId,
    );

    if (!event) {
      return failure('NOT_FOUND', 'Linked booking not found.');
    }

    try {
      await this.eventRepository.update(
        tenantId,
        event.id,
        { executionOwnerId: assignee.id },
        event.version,
      );
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Booking was modified by another request. Reload and retry.',
          { bookingId: event.id },
        );
      }
      throw error;
    }

    return success(undefined);
  }
}
