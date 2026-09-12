import type { SuggestionStatus } from '@prisma/client';

export type SuggestionRecord = {
  id: string;
  tenantId: string;
  type: string;
  status: SuggestionStatus;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateSuggestionData = {
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown> | null;
};

export abstract class SuggestionRepository {
  abstract create(
    tenantId: string,
    data: CreateSuggestionData,
  ): Promise<SuggestionRecord>;

  abstract findPendingByAggregate(
    tenantId: string,
    aggregateType: string,
    aggregateId: string,
    type: string,
  ): Promise<SuggestionRecord | null>;

  abstract listByStatus(
    tenantId: string,
    status: SuggestionStatus,
  ): Promise<SuggestionRecord[]>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<SuggestionRecord | null>;

  abstract updateStatus(
    tenantId: string,
    id: string,
    status: SuggestionStatus,
    version: number,
  ): Promise<SuggestionRecord>;
}
