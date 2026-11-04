import { describe, expect, it } from 'vitest';
import {
  founderKpiSchema,
  financeSummarySchema,
  inventorySummarySchema,
  leadPipelineSummarySchema,
  monthlyRevenueSummarySchema,
  parseDashboardData,
  salesSummarySchema,
  staffSummarySchema,
  upcomingEventsSchema,
} from './dashboard.schemas';
import { formatConversionRate, formatMoney } from '../lib/format';

describe('dashboard Zod schemas', () => {
  it('parses founder KPI envelope', () => {
    const payload = {
      data: {
        weekOf: '2026-07-06',
        kpis: {
          enquiries: 10,
          conversionRate: 0.25,
          eventsCompleted: 2,
          grossMargin: { amount: 50000, currency: 'INR' },
          leadSourcePerformance: {
            website: { totalLeads: 4, convertedLeads: 1, conversionRate: 0.25 },
          },
        },
      },
    };
    const parsed = parseDashboardData(founderKpiSchema, payload);
    expect(parsed.kpis.enquiries).toBe(10);
    expect(parsed.kpis.leadSourcePerformance.website?.totalLeads).toBe(4);
  });

  it('rejects invalid founder payload', () => {
    expect(() =>
      parseDashboardData(founderKpiSchema, { data: { weekOf: 'x' } }),
    ).toThrow();
  });

  it('parses lead pipeline and upcoming events', () => {
    expect(
      parseDashboardData(leadPipelineSummarySchema, {
        data: {
          totalLeads: 5,
          activeLeads: 3,
          stages: [{ stage: 'new', count: 3 }],
        },
      }).activeLeads,
    ).toBe(3);

    expect(
      parseDashboardData(upcomingEventsSchema, {
        data: {
          items: [
            {
              bookingId: 'b1',
              bookingNumber: 101,
              eventType: 'wedding',
              eventStartDate: '2026-08-01T00:00:00.000Z',
              venueName: 'Hall',
              status: 'confirmed',
              preparationStatus: 'on_track',
            },
          ],
        },
      }).items,
    ).toHaveLength(1);
  });

  it('parses F1-14 report summary envelopes', () => {
    expect(
      parseDashboardData(salesSummarySchema, {
        data: {
          totalLeads: 10,
          newLeadsInPeriod: 4,
          periodDays: 30,
          convertedLeads: 2,
          conversionRate: 0.2,
          byStage: { new: 4 },
          bySource: { website: 3 },
        },
      }).periodDays,
    ).toBe(30);

    expect(
      parseDashboardData(staffSummarySchema, {
        data: {
          totalAssignments: 8,
          byStatus: { confirmed: 5 },
          onSiteLeadCount: 2,
          unconfirmedForUpcomingEvents: 1,
        },
      }).onSiteLeadCount,
    ).toBe(2);

    expect(
      parseDashboardData(inventorySummarySchema, {
        data: { totalMovements: 12, byStatus: { planned: 3 } },
      }).totalMovements,
    ).toBe(12);

    expect(
      parseDashboardData(financeSummarySchema, {
        data: {
          totalConfirmedRevenue: { amount: 100, currency: 'INR' },
          totalConfirmedVendorExpenses: { amount: 40, currency: 'INR' },
          grossMargin: { amount: 60, currency: 'INR' },
          invoices: { total: 2, byStatus: { sent: 1 } },
        },
      }).grossMargin.amount,
    ).toBe(60);

    expect(
      parseDashboardData(monthlyRevenueSummarySchema, {
        data: {
          months: [
            {
              month: '2026-07',
              revenue: { amount: 10, currency: 'INR' },
              vendorExpenses: { amount: 3, currency: 'INR' },
              grossMargin: { amount: 7, currency: 'INR' },
            },
          ],
        },
      }).months,
    ).toHaveLength(1);
  });
});

describe('dashboard formatters', () => {
  it('formats money and conversion rate', () => {
    expect(formatConversionRate(0.5)).toBe('50.0%');
    expect(formatMoney({ amount: 1000, currency: 'INR' })).toContain('1');
  });
});
