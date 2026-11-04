import type { Prisma, SuggestionStatus } from '@prisma/client';

export type SuggestionRecord = {
  id: string;
  tenantId: string;
  type: string;
  status: SuggestionStatus;
  aggregateType: string;
  aggregateId: string;
  payload: Prisma.JsonValue;
  sourceEventId: string | null;
  comment: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedBy: string | null;
};

export type CreateSuggestionData = {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Prisma.InputJsonValue;
  sourceEventId?: string | null;
};

export type ResolveSuggestionData = {
  status: 'accepted' | 'dismissed';
  resolvedBy: string;
  comment?: string | null;
};

export type FindSuggestionsFilter = {
  status?: SuggestionStatus;
  type?: string;
};

export abstract class SuggestionRepository {
  abstract create(
    tenantId: string,
    data: CreateSuggestionData,
  ): Promise<SuggestionRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<SuggestionRecord | null>;

  abstract findMany(
    tenantId: string,
    filter?: FindSuggestionsFilter,
  ): Promise<SuggestionRecord[]>;

  abstract resolve(
    tenantId: string,
    id: string,
    data: ResolveSuggestionData,
  ): Promise<SuggestionRecord>;
}
