import { Injectable } from '@nestjs/common';
import type { Suggestion } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateSuggestionData,
  FindSuggestionsFilter,
  ResolveSuggestionData,
  SuggestionRecord,
  SuggestionRepository,
} from '../../domain/repositories/suggestion.repository';

@Injectable()
export class SuggestionRepositoryImpl
  extends TenantScopedRepository
  implements SuggestionRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateSuggestionData,
  ): Promise<SuggestionRecord> {
    const suggestion = await this.prisma.suggestion.create({
      data: {
        tenant: { connect: { id: tenantId } },
        type: data.type,
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        payload: data.payload ?? {},
        sourceEventId: data.sourceEventId ?? null,
      },
    });

    return this.mapRecord(suggestion);
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<SuggestionRecord | null> {
    const suggestion = await this.prisma.suggestion.findFirst({
      where: { id, tenantId },
    });

    return suggestion ? this.mapRecord(suggestion) : null;
  }

  async findMany(
    tenantId: string,
    filter?: FindSuggestionsFilter,
  ): Promise<SuggestionRecord[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: {
        tenantId,
        status: filter?.status,
        type: filter?.type,
      },
      orderBy: { createdAt: 'asc' },
    });

    return suggestions.map((suggestion) => this.mapRecord(suggestion));
  }

  async resolve(
    tenantId: string,
    id: string,
    data: ResolveSuggestionData,
  ): Promise<SuggestionRecord> {
    const suggestion = await this.prisma.suggestion.update({
      where: { id, tenantId },
      data: {
        status: data.status,
        resolvedAt: new Date(),
        resolvedBy: data.resolvedBy,
        comment: data.comment ?? null,
      },
    });

    return this.mapRecord(suggestion);
  }

  private mapRecord(suggestion: Suggestion): SuggestionRecord {
    return {
      id: suggestion.id,
      tenantId: suggestion.tenantId,
      type: suggestion.type,
      status: suggestion.status,
      aggregateType: suggestion.aggregateType,
      aggregateId: suggestion.aggregateId,
      payload: suggestion.payload,
      sourceEventId: suggestion.sourceEventId,
      comment: suggestion.comment,
      createdAt: suggestion.createdAt,
      resolvedAt: suggestion.resolvedAt,
      resolvedBy: suggestion.resolvedBy,
    };
  }
}
