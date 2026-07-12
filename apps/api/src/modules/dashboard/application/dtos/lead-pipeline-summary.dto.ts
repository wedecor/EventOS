import type { LeadStage } from '@prisma/client';

export type LeadPipelineStageDto = {
  stage: LeadStage;
  count: number;
};

// EP1-SAL-003 — Sales pipeline / status visibility, read-only projection grouped by stage.
export type LeadPipelineSummaryDto = {
  totalLeads: number;
  activeLeads: number;
  stages: LeadPipelineStageDto[];
};
