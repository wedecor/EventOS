import { Injectable } from '@nestjs/common';
import type { LeadSource, LeadStage } from '@prisma/client';
import { success, type Result } from '../../../../shared/application/result';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import type { LeadPipelineSummaryDto } from '../dtos/lead-pipeline-summary.dto';
import type { SalesSummaryDto } from '../dtos/sales-summary.dto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;
// EP1-SAL-003 — pipeline stages that represent a converted enquiry (booked or delivered).
const CONVERTED_LEAD_STAGES = new Set(['approved', 'completed']);
// EP1-SAL-003 — pipeline stages still open/actionable (not lost, cancelled, or completed).
const ACTIVE_LEAD_STAGES = new Set(['new', 'in_talks', 'approved']);

// EP1-SAL-001, EP1-SAL-002, EP1-SAL-003, EP1-KPI-002 — Sales/lead pipeline dashboards. Read-only
// aggregation of Lead data; no business logic duplication (uses the same LeadStage/LeadSource
// enums enforced by the Lead module).
@Injectable()
export class SalesDashboardQueryService {
  constructor(private readonly leadRepository: LeadRepository) {}

  async getSalesSummary(
    tenantId: string,
    periodDays: number = DEFAULT_PERIOD_DAYS,
  ): Promise<Result<SalesSummaryDto>> {
    const leads = await this.leadRepository.findAll(tenantId);
    const periodStart = new Date(Date.now() - periodDays * MS_PER_DAY);

    const newLeadsInPeriod = leads.filter(
      (lead) => lead.createdAt.getTime() >= periodStart.getTime(),
    ).length;

    const convertedLeads = leads.filter((lead) =>
      CONVERTED_LEAD_STAGES.has(lead.stage),
    ).length;

    const byStage: Partial<Record<LeadStage, number>> = {};
    const bySource: Partial<Record<LeadSource, number>> = {};

    for (const lead of leads) {
      byStage[lead.stage] = (byStage[lead.stage] ?? 0) + 1;
      bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
    }

    return success({
      totalLeads: leads.length,
      newLeadsInPeriod,
      periodDays,
      convertedLeads,
      conversionRate: leads.length > 0 ? convertedLeads / leads.length : 0,
      byStage,
      bySource,
    });
  }

  async getLeadPipelineSummary(
    tenantId: string,
  ): Promise<Result<LeadPipelineSummaryDto>> {
    const leads = await this.leadRepository.findAll(tenantId);

    const byStage = new Map<LeadStage, number>();
    for (const lead of leads) {
      byStage.set(lead.stage, (byStage.get(lead.stage) ?? 0) + 1);
    }

    const activeLeads = leads.filter((lead) =>
      ACTIVE_LEAD_STAGES.has(lead.stage),
    ).length;

    return success({
      totalLeads: leads.length,
      activeLeads,
      stages: Array.from(byStage.entries()).map(([stage, count]) => ({
        stage,
        count,
      })),
    });
  }
}
