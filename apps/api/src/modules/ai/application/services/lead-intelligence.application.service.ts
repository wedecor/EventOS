import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
} from '../../../../shared/audit';
import {
  LLM_PORT,
  LlmProviderError,
  type LlmPort,
} from '../../../../shared/llm';
import { AiExecutionRepository } from '../../domain/repositories/ai-execution.repository';
import { LEAD_INTELLIGENCE_PROMPT_VERSION } from '../lead-intelligence.constants';
import type { LeadIntelligenceResponseDto } from '../dtos/lead-intelligence.dto';
import {
  buildLeadIntelligenceSystemPrompt,
  buildLeadIntelligenceUserPrompt,
} from '../prompts/lead-intelligence.prompt';
import {
  leadIntelligenceJsonSchema,
  leadIntelligenceResultSchema,
} from '../schemas/lead-intelligence.schema';
import { AiUsageThrottleService } from './ai-usage-throttle.service';
import { LeadIntelligenceContextBuilder } from './lead-intelligence-context.builder';

const FEATURE_ID = 'lead_intelligence';

@Injectable()
export class LeadIntelligenceApplicationService {
  private readonly logger = new Logger(LeadIntelligenceApplicationService.name);

  constructor(
    private readonly contextBuilder: LeadIntelligenceContextBuilder,
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    private readonly auditLog: AuditLogService,
    private readonly aiExecutionRepository: AiExecutionRepository,
    private readonly aiUsageThrottle: AiUsageThrottleService,
  ) {}

  /**
   * Read-only Lead Intelligence. Does not update leads, send mail, or touch finance.
   * AI execution persistence failures are logged and do not fail the response.
   */
  async generate(
    tenantId: string,
    leadId: string,
    actorId: string,
    requestId?: string,
  ): Promise<Result<LeadIntelligenceResponseDto>> {
    const startedAt = Date.now();

    const throttle = await this.aiUsageThrottle.consume(
      tenantId,
      actorId,
      FEATURE_ID,
    );
    if (!throttle.allowed) {
      await this.recordOutcome({
        tenantId,
        actorId,
        leadId,
        requestId,
        startedAt,
        status: 'failure',
        failureCategory: 'RATE_LIMITED',
        provider: this.llm.providerName,
        model: this.llm.model,
      });
      return failure(
        'RATE_LIMITED',
        `AI usage limit reached${throttle.scope ? ` (${throttle.scope})` : ''}. Try again in ${throttle.retryAfterSeconds}s.`,
        {
          retryAfterSeconds: throttle.retryAfterSeconds,
          scope: throttle.scope,
        },
      );
    }

    const contextResult = await this.contextBuilder.build(tenantId, leadId);
    if (!contextResult.ok) {
      await this.recordOutcome({
        tenantId,
        actorId,
        leadId,
        requestId,
        startedAt,
        status: 'failure',
        failureCategory: contextResult.error.code,
        provider: this.llm.providerName,
        model: this.llm.model,
      });
      return contextResult;
    }

    const context = contextResult.value;
    const messages = [
      { role: 'system' as const, content: buildLeadIntelligenceSystemPrompt() },
      {
        role: 'user' as const,
        content: buildLeadIntelligenceUserPrompt(JSON.stringify(context)),
      },
    ];

    try {
      const llmResult = await this.llm.completeStructured({
        messages,
        schemaName: 'lead_intelligence',
        jsonSchema: leadIntelligenceJsonSchema,
        temperature: 0,
      });

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(llmResult.content);
      } catch {
        await this.recordOutcome({
          tenantId,
          actorId,
          leadId,
          requestId,
          startedAt,
          status: 'failure',
          failureCategory: 'INVALID_LLM_OUTPUT',
          provider: llmResult.provider,
          model: llmResult.model,
          promptTokens: llmResult.usage.promptTokens,
          completionTokens: llmResult.usage.completionTokens,
          totalTokens: llmResult.usage.totalTokens,
          estimatedCostUsd: llmResult.estimatedCostUsd,
        });
        return failure(
          'VALIDATION_ERROR',
          'Lead intelligence model returned invalid JSON.',
        );
      }

      const validated = leadIntelligenceResultSchema.safeParse(parsedJson);
      if (!validated.success) {
        await this.recordOutcome({
          tenantId,
          actorId,
          leadId,
          requestId,
          startedAt,
          status: 'failure',
          failureCategory: 'INVALID_LLM_OUTPUT',
          provider: llmResult.provider,
          model: llmResult.model,
          promptTokens: llmResult.usage.promptTokens,
          completionTokens: llmResult.usage.completionTokens,
          totalTokens: llmResult.usage.totalTokens,
          estimatedCostUsd: llmResult.estimatedCostUsd,
        });
        return failure(
          'VALIDATION_ERROR',
          'Lead intelligence model returned an unexpected structure.',
        );
      }

      const response: LeadIntelligenceResponseDto = {
        leadId,
        generatedAt: new Date().toISOString(),
        promptVersion: LEAD_INTELLIGENCE_PROMPT_VERSION,
        provider: llmResult.provider,
        model: llmResult.model,
        usage: {
          promptTokens: llmResult.usage.promptTokens,
          completionTokens: llmResult.usage.completionTokens,
          totalTokens: llmResult.usage.totalTokens,
          estimatedCostUsd: llmResult.estimatedCostUsd,
        },
        intelligence: validated.data,
        readOnly: true,
      };

      await this.recordOutcome({
        tenantId,
        actorId,
        leadId,
        requestId,
        startedAt,
        status: 'success',
        provider: llmResult.provider,
        model: llmResult.model,
        promptTokens: llmResult.usage.promptTokens,
        completionTokens: llmResult.usage.completionTokens,
        totalTokens: llmResult.usage.totalTokens,
        estimatedCostUsd: llmResult.estimatedCostUsd,
      });

      return success(response);
    } catch (error: unknown) {
      if (error instanceof LlmProviderError) {
        const mapped: Result<LeadIntelligenceResponseDto> =
          error.code === 'TIMEOUT'
            ? failure('EXTERNAL_SERVICE_ERROR', 'AI provider timed out.')
            : error.code === 'DISABLED'
              ? failure(
                  'INVALID_STATE',
                  'AI provider is disabled for this environment.',
                )
              : failure(
                  'EXTERNAL_SERVICE_ERROR',
                  'AI provider request failed.',
                );

        await this.recordOutcome({
          tenantId,
          actorId,
          leadId,
          requestId,
          startedAt,
          status: 'failure',
          failureCategory: error.code,
          provider: this.llm.providerName,
          model: this.llm.model,
        });
        return mapped;
      }
      throw error;
    }
  }

  private async recordOutcome(input: {
    tenantId: string;
    actorId: string;
    leadId: string;
    requestId?: string;
    startedAt: number;
    status: 'success' | 'failure';
    failureCategory?: string;
    provider: string;
    model: string;
    promptTokens?: number | null;
    completionTokens?: number | null;
    totalTokens?: number | null;
    estimatedCostUsd?: number | null;
  }): Promise<void> {
    const durationMs = Date.now() - input.startedAt;

    try {
      await this.auditLog.record({
        actorId: input.actorId,
        tenantId: input.tenantId,
        action: AUDIT_ACTIONS.LEAD_AI_INTELLIGENCE,
        entityType: AUDIT_ENTITY_TYPES.LEAD,
        entityId: input.leadId,
        outcome: input.status,
        metadata: {
          provider: input.provider,
          model: input.model,
          promptVersion: LEAD_INTELLIGENCE_PROMPT_VERSION,
          promptTokens: input.promptTokens ?? null,
          completionTokens: input.completionTokens ?? null,
          estimatedCostUsd: input.estimatedCostUsd ?? null,
          requestId: input.requestId,
          readOnly: true,
          failureCategory: input.failureCategory,
          durationMs,
        },
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Audit log failed for lead intelligence (${input.leadId}): ${String(error)}`,
      );
    }

    try {
      await this.aiExecutionRepository.create(input.tenantId, {
        userId: input.actorId,
        leadId: input.leadId,
        feature: FEATURE_ID,
        provider: input.provider,
        model: input.model,
        promptVersion: LEAD_INTELLIGENCE_PROMPT_VERSION,
        status: input.status,
        promptTokens: input.promptTokens ?? null,
        completionTokens: input.completionTokens ?? null,
        totalTokens: input.totalTokens ?? null,
        estimatedCostUsd: input.estimatedCostUsd ?? null,
        durationMs,
        correlationId: input.requestId ?? null,
        failureCategory: input.failureCategory ?? null,
      });
    } catch (error: unknown) {
      // Analytics persistence must not break the read-only business response.
      this.logger.warn(
        `AiExecution persistence failed for lead ${input.leadId}: ${String(error)}`,
      );
    }
  }
}
