export type AiExecutionStatus = 'success' | 'failure';

export type CreateAiExecutionData = {
  userId: string;
  leadId?: string | null;
  feature: string;
  provider: string;
  model: string;
  promptVersion: string;
  status: AiExecutionStatus;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
  estimatedCostUsd?: number | null;
  durationMs?: number | null;
  correlationId?: string | null;
  failureCategory?: string | null;
};

export type AiExecutionRecord = CreateAiExecutionData & {
  id: string;
  tenantId: string;
  createdAt: Date;
};

export abstract class AiExecutionRepository {
  abstract create(
    tenantId: string,
    data: CreateAiExecutionData,
  ): Promise<AiExecutionRecord>;
}
