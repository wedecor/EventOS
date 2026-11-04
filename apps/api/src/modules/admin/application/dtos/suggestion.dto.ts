import type { SuggestionRecord } from '../../domain/repositories/suggestion.repository';

export type SuggestionDto = {
  id: string;
  tenantId: string;
  type: string;
  status: SuggestionRecord['status'];
  aggregateType: string;
  aggregateId: string;
  payload: SuggestionRecord['payload'];
  sourceEventId: string | null;
  comment: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
};

export function toSuggestionDto(record: SuggestionRecord): SuggestionDto {
  return { ...record };
}
