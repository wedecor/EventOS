import { Injectable } from '@nestjs/common';
import type { AiExecution } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  AiExecutionRecord,
  AiExecutionRepository,
  CreateAiExecutionData,
} from '../../domain/repositories/ai-execution.repository';

@Injectable()
export class AiExecutionRepositoryImpl
  extends TenantScopedRepository
  implements AiExecutionRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateAiExecutionData,
  ): Promise<AiExecutionRecord> {
    const row = await this.prisma.aiExecution.create({
      data: {
        tenant: { connect: { id: tenantId } },
        user: { connect: { id: data.userId } },
        ...(data.leadId
          ? { lead: { connect: { id: data.leadId } } }
          : {}),
        feature: data.feature,
        provider: data.provider,
        model: data.model,
        promptVersion: data.promptVersion,
        status: data.status,
        promptTokens: data.promptTokens ?? null,
        completionTokens: data.completionTokens ?? null,
        totalTokens: data.totalTokens ?? null,
        estimatedCostUsd:
          data.estimatedCostUsd == null
            ? null
            : new Prisma.Decimal(data.estimatedCostUsd),
        durationMs: data.durationMs ?? null,
        correlationId: data.correlationId ?? null,
        failureCategory: data.failureCategory ?? null,
      },
    });
    return this.map(row);
  }

  private map(row: AiExecution): AiExecutionRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      leadId: row.leadId,
      feature: row.feature,
      provider: row.provider,
      model: row.model,
      promptVersion: row.promptVersion,
      status: row.status,
      promptTokens: row.promptTokens,
      completionTokens: row.completionTokens,
      totalTokens: row.totalTokens,
      estimatedCostUsd:
        row.estimatedCostUsd == null ? null : Number(row.estimatedCostUsd),
      durationMs: row.durationMs,
      correlationId: row.correlationId,
      failureCategory: row.failureCategory,
      createdAt: row.createdAt,
    };
  }
}
