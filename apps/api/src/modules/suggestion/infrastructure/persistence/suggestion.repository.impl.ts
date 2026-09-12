import { Injectable } from '@nestjs/common';
import type { Prisma, Suggestion, SuggestionStatus } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import {
  SuggestionRepository,
  type CreateSuggestionData,
  type SuggestionRecord,
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
        tenantId,
        type: data.type,
        status: 'pending',
        aggregateType: data.aggregateType,
        aggregateId: data.aggregateId,
        payload: (data.payload ?? undefined) as
          Prisma.InputJsonValue | undefined,
      },
    });

    return this.map(suggestion);
  }

  async findPendingByAggregate(
    tenantId: string,
    aggregateType: string,
    aggregateId: string,
    type: string,
  ): Promise<SuggestionRecord | null> {
    const suggestion = await this.prisma.suggestion.findFirst({
      where: {
        tenantId,
        aggregateType,
        aggregateId,
        type,
        status: 'pending',
      },
    });

    return suggestion ? this.map(suggestion) : null;
  }

  async listByStatus(
    tenantId: string,
    status: SuggestionRecord['status'],
  ): Promise<SuggestionRecord[]> {
    const suggestions = await this.prisma.suggestion.findMany({
      where: { tenantId, status },
      orderBy: { createdAt: 'desc' },
    });

    return suggestions.map((item) => this.map(item));
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<SuggestionRecord | null> {
    const suggestion = await this.prisma.suggestion.findFirst({
      where: { id, tenantId },
    });

    return suggestion ? this.map(suggestion) : null;
  }

  async updateStatus(
    tenantId: string,
    id: string,
    status: SuggestionStatus,
    version: number,
  ): Promise<SuggestionRecord> {
    try {
      const suggestion = await this.prisma.suggestion.update({
        where: { id, tenantId, version },
        data: { status, version: { increment: 1 } },
      });

      return this.map(suggestion);
    } catch (error: unknown) {
      this.toConcurrentModification('Suggestion', id, error);
    }
  }

  private map(suggestion: Suggestion): SuggestionRecord {
    return {
      id: suggestion.id,
      tenantId: suggestion.tenantId,
      type: suggestion.type,
      status: suggestion.status,
      aggregateType: suggestion.aggregateType,
      aggregateId: suggestion.aggregateId,
      payload:
        suggestion.payload && typeof suggestion.payload === 'object'
          ? (suggestion.payload as Record<string, unknown>)
          : null,
      createdAt: suggestion.createdAt,
      updatedAt: suggestion.updatedAt,
      version: suggestion.version,
    };
  }
}
