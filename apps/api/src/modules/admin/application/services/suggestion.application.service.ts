import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  SuggestionAcceptedEvent,
  SuggestionDismissedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { WorkspaceService } from '../../../booking/application/services/workspace.service';
import { EventChecklistApplicationService } from '../../../checklist/application/services/event-checklist.application.service';
import { StaffAssignmentApplicationService } from '../../../staff/application/services/staff-assignment.application.service';
import {
  SuggestionRepository,
  type FindSuggestionsFilter,
  type SuggestionRecord,
} from '../../domain/repositories/suggestion.repository';
import { toSuggestionDto, type SuggestionDto } from '../dtos/suggestion.dto';

export type AcceptSuggestionInput = {
  comment?: string | null;
  actorUserId: string;
  actorRole: string;
};

export type DismissSuggestionInput = {
  comment?: string | null;
  actorUserId: string;
  actorRole: string;
};

/** docs/09 §Administration — Suggestion types handled in Phase 1 + approver roles. */
const ACCEPT_ROLES_BY_TYPE: Record<string, readonly string[]> = {
  'workspace.create': ['operations_manager', 'coordinator', 'owner', 'admin'],
  'checklist.generate': ['operations_manager', 'coordinator', 'owner', 'admin'],
  'staff.assign': ['operations_manager', 'owner', 'admin'],
};

const DISMISS_ROLES_BY_TYPE = ACCEPT_ROLES_BY_TYPE;

// EP1-AUT-001–005 / ADR-017 — Suggestion queue accept/dismiss (R3-03).
// Handlers that *create* suggestions are out of scope (decision 2A).
// Accept delegates to existing use cases only (decision 1B); checklist.generate
// invokes EventChecklistApplicationService.generateFromTemplates (P2-02).
@Injectable()
export class SuggestionApplicationService {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly workspaceService: WorkspaceService,
    private readonly staffAssignmentService: StaffAssignmentApplicationService,
    private readonly eventChecklistService: EventChecklistApplicationService,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async listSuggestions(
    tenantId: string,
    filter?: FindSuggestionsFilter,
  ): Promise<Result<SuggestionDto[]>> {
    const suggestions = await this.suggestionRepository.findMany(
      tenantId,
      filter,
    );
    return success(suggestions.map(toSuggestionDto));
  }

  async acceptSuggestion(
    tenantId: string,
    id: string,
    input: AcceptSuggestionInput,
  ): Promise<Result<SuggestionDto>> {
    const existing = await this.suggestionRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Suggestion not found.');
    }

    if (existing.status !== 'pending') {
      return failure(
        'INVALID_STATE',
        'Only pending suggestions can be accepted.',
        { status: existing.status },
      );
    }

    const roleError = this.assertTypeRole(
      existing.type,
      input.actorRole,
      ACCEPT_ROLES_BY_TYPE,
    );
    if (roleError) {
      return roleError;
    }

    const executionResult = await this.executeTarget(tenantId, existing);
    if (!executionResult.ok) {
      return executionResult;
    }

    const accepted = await this.markAccepted(tenantId, existing, input);
    this.eventPublisher.publish(
      new SuggestionAcceptedEvent(tenantId, accepted),
    );

    return success(toSuggestionDto(accepted));
  }

  async dismissSuggestion(
    tenantId: string,
    id: string,
    input: DismissSuggestionInput,
  ): Promise<Result<SuggestionDto>> {
    const existing = await this.suggestionRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Suggestion not found.');
    }

    if (existing.status !== 'pending') {
      return failure(
        'INVALID_STATE',
        'Only pending suggestions can be dismissed.',
        { status: existing.status },
      );
    }

    const roleError = this.assertTypeRole(
      existing.type,
      input.actorRole,
      DISMISS_ROLES_BY_TYPE,
    );
    if (roleError) {
      return roleError;
    }

    const dismissed = await this.suggestionRepository.resolve(tenantId, id, {
      status: 'dismissed',
      resolvedBy: input.actorUserId,
      comment: input.comment,
    });

    this.eventPublisher.publish(
      new SuggestionDismissedEvent(tenantId, dismissed),
    );

    return success(toSuggestionDto(dismissed));
  }

  private assertTypeRole(
    type: string,
    role: string,
    matrix: Record<string, readonly string[]>,
  ): Result<never> | null {
    const allowed = matrix[type];
    if (!allowed) {
      return failure(
        'VALIDATION_ERROR',
        `Unsupported suggestion type '${type}'.`,
        { type },
      );
    }

    if (!allowed.includes(role)) {
      return failure(
        'FORBIDDEN',
        `Role '${role}' is not permitted to act on suggestion type '${type}'.`,
        { type, role },
      );
    }

    return null;
  }

  private async markAccepted(
    tenantId: string,
    existing: SuggestionRecord,
    input: AcceptSuggestionInput,
  ): Promise<SuggestionRecord> {
    return this.suggestionRepository.resolve(tenantId, existing.id, {
      status: 'accepted',
      resolvedBy: input.actorUserId,
      comment: input.comment,
    });
  }

  private async executeTarget(
    tenantId: string,
    suggestion: SuggestionRecord,
  ): Promise<Result<void>> {
    const payload = asPayloadObject(suggestion.payload);

    switch (suggestion.type) {
      case 'workspace.create': {
        const bookingId = suggestion.aggregateId;
        const version =
          typeof payload.version === 'number'
            ? payload.version
            : await this.resolveBookingVersion(tenantId, bookingId);

        if (version === null) {
          return failure(
            'NOT_FOUND',
            'Booking not found for workspace.create.',
            {
              bookingId,
            },
          );
        }

        const result = await this.workspaceService.activateWorkspace(
          tenantId,
          bookingId,
          { version },
        );
        if (!result.ok) {
          return result;
        }
        return success(undefined);
      }

      case 'staff.assign': {
        const staffMemberId =
          typeof payload.staffMemberId === 'string'
            ? payload.staffMemberId
            : null;
        if (!staffMemberId) {
          return failure(
            'VALIDATION_ERROR',
            'staff.assign payload requires staffMemberId.',
          );
        }

        const bookingId = suggestion.aggregateId;
        const result = await this.staffAssignmentService.createAssignment(
          tenantId,
          {
            bookingId,
            staffMemberId,
            role: typeof payload.role === 'string' ? payload.role : null,
            isOnSiteLead:
              typeof payload.isOnSiteLead === 'boolean'
                ? payload.isOnSiteLead
                : undefined,
            reportingAt:
              typeof payload.reportingAt === 'string'
                ? new Date(payload.reportingAt)
                : null,
            note: typeof payload.note === 'string' ? payload.note : null,
          },
        );
        if (!result.ok) {
          return result;
        }
        return success(undefined);
      }

      case 'checklist.generate': {
        const bookingId = suggestion.aggregateId;
        const templateIds = Array.isArray(payload.templateIds)
          ? payload.templateIds.filter(
              (id): id is string => typeof id === 'string',
            )
          : undefined;
        const result = await this.eventChecklistService.generateFromTemplates(
          tenantId,
          {
            bookingId,
            templateIds:
              templateIds && templateIds.length > 0 ? templateIds : undefined,
          },
        );
        if (!result.ok) {
          return result;
        }
        return success(undefined);
      }

      default:
        return failure(
          'VALIDATION_ERROR',
          `Unsupported suggestion type '${suggestion.type}'.`,
          { type: suggestion.type },
        );
    }
  }

  private async resolveBookingVersion(
    tenantId: string,
    bookingId: string,
  ): Promise<number | null> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    return booking?.version ?? null;
  }
}

function asPayloadObject(
  payload: SuggestionRecord['payload'],
): Record<string, unknown> {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }
  return {};
}
