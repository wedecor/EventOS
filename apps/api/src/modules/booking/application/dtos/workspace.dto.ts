import type { EventRecord } from '../../domain/repositories/event.repository';

export type WorkspaceDto = {
  eventId: string;
  workspaceStatus: EventRecord['workspaceStatus'];
  preparationStatus: EventRecord['preparationStatus'];
  operationalMilestone: string | null;
  executionOwnerId: string | null;
};

export function toWorkspaceDto(event: EventRecord): WorkspaceDto {
  return {
    eventId: event.id,
    workspaceStatus: event.workspaceStatus,
    preparationStatus: event.preparationStatus,
    operationalMilestone: event.operationalMilestone,
    executionOwnerId: event.executionOwnerId,
  };
}
