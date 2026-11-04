import type { IssueNoteRecord } from '../../domain/repositories/issue-note.repository';

/** docs/09 POST /events/:eventId/issues response shape. */
export type IssueNoteCreateResultDto = {
  id: string;
  eventId: string;
  status: IssueNoteRecord['status'];
};

export function toIssueNoteCreateResultDto(
  note: IssueNoteRecord,
): IssueNoteCreateResultDto {
  return {
    id: note.id,
    eventId: note.eventId,
    status: note.status,
  };
}
