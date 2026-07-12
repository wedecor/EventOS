import { Injectable } from '@nestjs/common';
import { success, type Result } from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { VendorExpenseRepository } from '../../../finance/domain/repositories/vendor-expense.repository';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import type { LeadRecord } from '../../../lead/domain/repositories/lead.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import type {
  FounderKpiDto,
  LeadSourcePerformanceDto,
} from '../dtos/founder-kpi.dto';

const DEFAULT_CURRENCY = 'INR';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
// EP1-SAL-003 — pipeline stages that represent a converted enquiry (booked or delivered).
const CONVERTED_LEAD_STAGES = new Set(['approved', 'completed']);

export type FounderKpiParams = {
  from?: Date;
  to?: Date;
};

// EP1-KPI-001–EP1-KPI-005, EP1-MKT-001, EP1-MKT-002 — Founder KPI dashboard (weekly review,
// EP1-KPI-006). Read-only aggregation of Lead, Event, Payment, and VendorExpense data — no
// business logic duplication (revenue/margin basis matches `ProfitabilityApplicationService`:
// confirmed payments minus confirmed vendor expenses).
@Injectable()
export class FounderKpiQueryService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly eventRepository: EventRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly vendorExpenseRepository: VendorExpenseRepository,
  ) {}

  async getFounderKpis(
    tenantId: string,
    params: FounderKpiParams = {},
  ): Promise<Result<FounderKpiDto>> {
    const to = params.to ?? new Date();
    const from = params.from ?? new Date(to.getTime() - 7 * MS_PER_DAY);

    const [leads, events, payments, expenses] = await Promise.all([
      this.leadRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
    ]);

    const leadsInPeriod = leads.filter((lead) =>
      this.isWithin(lead.createdAt, from, to),
    );
    const enquiries = leadsInPeriod.length;
    const convertedInPeriod = leadsInPeriod.filter((lead) =>
      CONVERTED_LEAD_STAGES.has(lead.stage),
    ).length;
    const conversionRate = enquiries > 0 ? convertedInPeriod / enquiries : 0;

    const completedInPeriod = events.filter(
      (event) =>
        event.status === 'completed' &&
        event.completedAt !== null &&
        this.isWithin(event.completedAt, from, to),
    );
    const eventsCompleted = completedInPeriod.length;
    const completedBookingIds = new Set(
      completedInPeriod.map((event) => event.id),
    );

    const revenue = payments
      .filter(
        (payment) =>
          payment.status === 'confirmed' &&
          payment.bookingId !== null &&
          completedBookingIds.has(payment.bookingId),
      )
      .reduce((sum, payment) => sum + payment.amount, 0);

    const vendorExpenseTotal = expenses
      .filter(
        (expense) =>
          expense.status === 'confirmed' &&
          completedBookingIds.has(expense.bookingId),
      )
      .reduce((sum, expense) => sum + expense.amount, 0);

    return success({
      weekOf: this.toIsoDate(from),
      kpis: {
        enquiries,
        conversionRate,
        eventsCompleted,
        grossMargin: {
          amount: revenue - vendorExpenseTotal,
          currency: DEFAULT_CURRENCY,
        },
        leadSourcePerformance: this.buildLeadSourcePerformance(leadsInPeriod),
      },
    });
  }

  private buildLeadSourcePerformance(
    leads: LeadRecord[],
  ): LeadSourcePerformanceDto {
    const bySource: LeadSourcePerformanceDto = {};

    for (const lead of leads) {
      const entry = bySource[lead.source] ?? {
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
      };
      entry.totalLeads += 1;
      if (CONVERTED_LEAD_STAGES.has(lead.stage)) {
        entry.convertedLeads += 1;
      }
      bySource[lead.source] = entry;
    }

    for (const performance of Object.values(bySource)) {
      performance.conversionRate =
        performance.totalLeads > 0
          ? performance.convertedLeads / performance.totalLeads
          : 0;
    }

    return bySource;
  }

  private isWithin(date: Date, from: Date, to: Date): boolean {
    return date.getTime() >= from.getTime() && date.getTime() <= to.getTime();
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
