import {
  SuggestionAcceptedEvent,
  SuggestionDismissedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { success, failure } from '../../../../shared/application/result';
import type { EventRepository } from '../../../booking/domain/repositories/event.repository';
import type { WorkspaceService } from '../../../booking/application/services/workspace.service';
import type { EventChecklistApplicationService } from '../../../checklist/application/services/event-checklist.application.service';
import type { StaffAssignmentApplicationService } from '../../../staff/application/services/staff-assignment.application.service';
import { SuggestionApplicationService } from './suggestion.application.service';
import type {
  SuggestionRecord,
  SuggestionRepository,
} from '../../domain/repositories/suggestion.repository';

describe('SuggestionApplicationService', () => {
  const tenantId = 'tenant-1';
  const suggestionId = 'suggestion-1';
  const bookingId = 'booking-1';
  const actor = {
    actorUserId: 'user-1',
    actorRole: 'operations_manager',
  };

  const baseSuggestion: SuggestionRecord = {
    id: suggestionId,
    tenantId,
    type: 'workspace.create',
    status: 'pending',
    aggregateType: 'booking',
    aggregateId: bookingId,
    payload: { version: 1 },
    sourceEventId: null,
    comment: null,
    createdAt: new Date(),
    resolvedAt: null,
    resolvedBy: null,
  };

  let suggestionRepository: jest.Mocked<SuggestionRepository>;
  let workspaceService: jest.Mocked<
    Pick<WorkspaceService, 'activateWorkspace'>
  >;
  let staffAssignmentService: jest.Mocked<
    Pick<StaffAssignmentApplicationService, 'createAssignment'>
  >;
  let eventChecklistService: jest.Mocked<
    Pick<EventChecklistApplicationService, 'generateFromTemplates'>
  >;
  let eventRepository: jest.Mocked<Pick<EventRepository, 'findById'>>;
  let publish: jest.Mock;
  let service: SuggestionApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    suggestionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      resolve: jest.fn(),
    };
    workspaceService = {
      activateWorkspace: jest.fn(),
    };
    staffAssignmentService = {
      createAssignment: jest.fn(),
    };
    eventChecklistService = {
      generateFromTemplates: jest.fn(),
    };
    eventRepository = {
      findById: jest.fn(),
    };

    service = new SuggestionApplicationService(
      suggestionRepository,
      workspaceService as WorkspaceService,
      staffAssignmentService as StaffAssignmentApplicationService,
      eventChecklistService as EventChecklistApplicationService,
      eventRepository as unknown as EventRepository,
      { publish },
    );
  });

  it('listSuggestions returns repository results', async () => {
    suggestionRepository.findMany.mockResolvedValue([baseSuggestion]);

    const result = await service.listSuggestions(tenantId, {
      status: 'pending',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
    }
  });

  it('acceptSuggestion returns NOT_FOUND when missing', async () => {
    suggestionRepository.findById.mockResolvedValue(null);

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('acceptSuggestion rejects non-pending suggestions', async () => {
    suggestionRepository.findById.mockResolvedValue({
      ...baseSuggestion,
      status: 'dismissed',
    });

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('acceptSuggestion forbids coordinator on staff.assign (docs/09 type roles)', async () => {
    suggestionRepository.findById.mockResolvedValue({
      ...baseSuggestion,
      type: 'staff.assign',
      payload: { staffMemberId: 'staff-1' },
    });

    const result = await service.acceptSuggestion(tenantId, suggestionId, {
      ...actor,
      actorRole: 'coordinator',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FORBIDDEN');
    }
    expect(staffAssignmentService.createAssignment).not.toHaveBeenCalled();
  });

  it('acceptSuggestion activates workspace for workspace.create', async () => {
    const accepted = {
      ...baseSuggestion,
      status: 'accepted' as const,
      resolvedAt: new Date(),
      resolvedBy: actor.actorUserId,
    };
    suggestionRepository.findById.mockResolvedValue(baseSuggestion);
    workspaceService.activateWorkspace.mockResolvedValue(
      success({
        bookingId,
        workspaceStatus: 'active',
        version: 2,
      } as never),
    );
    suggestionRepository.resolve.mockResolvedValue(accepted);

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(true);
    expect(workspaceService.activateWorkspace).toHaveBeenCalledWith(
      tenantId,
      bookingId,
      { version: 1 },
    );
    expect(publish).toHaveBeenCalledWith(expect.any(SuggestionAcceptedEvent));
  });

  it('acceptSuggestion does not mark accepted when workspace activation fails', async () => {
    suggestionRepository.findById.mockResolvedValue(baseSuggestion);
    workspaceService.activateWorkspace.mockResolvedValue(
      failure('INVALID_STATE', 'Workspace is already active.'),
    );

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
    expect(suggestionRepository.resolve).not.toHaveBeenCalled();
  });

  it('acceptSuggestion creates staff assignment for staff.assign', async () => {
    const pending = {
      ...baseSuggestion,
      type: 'staff.assign',
      payload: { staffMemberId: 'staff-user-1', role: 'decorator' },
    };
    const accepted = {
      ...pending,
      status: 'accepted' as const,
      resolvedBy: actor.actorUserId,
      resolvedAt: new Date(),
    };
    suggestionRepository.findById.mockResolvedValue(pending);
    staffAssignmentService.createAssignment.mockResolvedValue(
      success({ id: 'assignment-1' } as never),
    );
    suggestionRepository.resolve.mockResolvedValue(accepted);

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(true);
    expect(staffAssignmentService.createAssignment).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        bookingId,
        staffMemberId: 'staff-user-1',
        role: 'decorator',
      }),
    );
  });

  it('acceptSuggestion for checklist.generate generates event checklists', async () => {
    const pending = {
      ...baseSuggestion,
      type: 'checklist.generate',
      payload: { templateIds: ['tmpl-1'] },
    };
    const accepted = {
      ...pending,
      status: 'accepted' as const,
      resolvedBy: actor.actorUserId,
      resolvedAt: new Date(),
    };
    suggestionRepository.findById.mockResolvedValue(pending);
    eventChecklistService.generateFromTemplates.mockResolvedValue(
      success([{ id: 'ec-1' }] as never),
    );
    suggestionRepository.resolve.mockResolvedValue(accepted);

    const result = await service.acceptSuggestion(
      tenantId,
      suggestionId,
      actor,
    );

    expect(result.ok).toBe(true);
    expect(eventChecklistService.generateFromTemplates).toHaveBeenCalledWith(
      tenantId,
      { bookingId, templateIds: ['tmpl-1'] },
    );
    expect(publish).toHaveBeenCalledWith(expect.any(SuggestionAcceptedEvent));
  });

  it('dismissSuggestion marks dismissed without executing target actions', async () => {
    const dismissed = {
      ...baseSuggestion,
      status: 'dismissed' as const,
      resolvedBy: actor.actorUserId,
      resolvedAt: new Date(),
      comment: 'not needed',
    };
    suggestionRepository.findById.mockResolvedValue(baseSuggestion);
    suggestionRepository.resolve.mockResolvedValue(dismissed);

    const result = await service.dismissSuggestion(tenantId, suggestionId, {
      ...actor,
      comment: 'not needed',
    });

    expect(result.ok).toBe(true);
    expect(workspaceService.activateWorkspace).not.toHaveBeenCalled();
    expect(staffAssignmentService.createAssignment).not.toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith(expect.any(SuggestionDismissedEvent));
  });
});
