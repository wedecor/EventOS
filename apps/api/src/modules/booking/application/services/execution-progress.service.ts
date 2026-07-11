import { Injectable } from '@nestjs/common';
import type { PreparationStatus } from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { ExecutionProgressAdvancedEvent } from '../../../../shared/events/sprint2-domain.events';
import { EventRepository } from '../../domain/repositories/event.repository';
import { toWorkspaceDto, type WorkspaceDto } from '../dtos/workspace.dto';

export type AdvanceStageInput = {
  milestoneKey: string;
  preparationStatus?: PreparationStatus;
  version: number;
};

// EP1-OPS-004, EP1-BR-003 — Advance execution stage
@Injectable()
export class ExecutionProgressService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async advanceStage(
    tenantId: string,
    bookingId: string,
    input: AdvanceStageInput,
  ): Promise<Result<WorkspaceDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    // EP1-BR-003: executionOwnerId must be set before advancing
    if (!existing.executionOwnerId) {
      return failure(
        'EP1-BR-003',
        'An execution owner must be assigned before advancing execution stages.',
        { bookingId },
      );
    }

    if (
      existing.status !== 'in_preparation' &&
      existing.status !== 'in_execution'
    ) {
      return failure(
        'INVALID_STATE',
        'Execution stages can only be advanced for in-preparation or in-execution events.',
        { status: existing.status },
      );
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        {
          operationalMilestone: input.milestoneKey,
          ...(input.preparationStatus
            ? { preparationStatus: input.preparationStatus }
            : {}),
        },
        input.version,
      );

      this.eventPublisher.publish(
        new ExecutionProgressAdvancedEvent(tenantId, event, input.milestoneKey),
      );

      return success(toWorkspaceDto(event));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Booking was modified by another request. Reload and retry.',
          { bookingId },
        );
      }
      throw error;
    }
  }
}
