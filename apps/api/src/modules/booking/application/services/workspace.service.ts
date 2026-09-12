import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { WorkspaceActivatedEvent } from '../../../../shared/events/sprint2-domain.events';
import { EventRepository } from '../../domain/repositories/event.repository';
import { toWorkspaceDto, type WorkspaceDto } from '../dtos/workspace.dto';

export type ActivateWorkspaceInput = {
  version: number;
};

// EP1-OPS-001, EP1-AUT-002 — Activate workspace for an approved event
@Injectable()
export class WorkspaceService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async activateWorkspace(
    tenantId: string,
    bookingId: string,
    input: ActivateWorkspaceInput,
  ): Promise<Result<WorkspaceDto>> {
    const existing = await this.eventRepository.findById(tenantId, bookingId);
    if (!existing) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (
      existing.status !== 'approved' &&
      existing.status !== 'in_preparation'
    ) {
      return failure(
        'INVALID_STATE',
        'Workspace can only be activated for approved or in-preparation events.',
        { status: existing.status },
      );
    }

    if (existing.workspaceStatus === 'active') {
      return failure('INVALID_STATE', 'Workspace is already active.', {
        workspaceStatus: existing.workspaceStatus,
      });
    }

    try {
      const event = await this.eventRepository.update(
        tenantId,
        bookingId,
        { workspaceStatus: 'active' },
        input.version,
      );

      this.eventPublisher.publish(new WorkspaceActivatedEvent(tenantId, event));

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

  async getWorkspace(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<WorkspaceDto>> {
    const event = await this.eventRepository.findById(tenantId, bookingId);
    if (!event) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    return success(toWorkspaceDto(event));
  }
}
