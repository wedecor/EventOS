import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../../communication/domain/repositories/reminder.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { VendorExpenseRepository } from '../../../finance/domain/repositories/vendor-expense.repository';
import { FinancialDocumentRepository } from '../../../finance/domain/repositories/financial-document.repository';
import { InventoryItemRepository } from '../../../inventory/domain/repositories/inventory-item.repository';
import { InventoryMovementRepository } from '../../../inventory/domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from '../../../inventory/domain/repositories/inventory-reservation.repository';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import { SchedulingApplicationService } from '../../../staff/application/services/scheduling.application.service';
import { StaffLeaveRepository } from '../../../staff/domain/repositories/staff-leave.repository';
import { StaffMemberRepository } from '../../../staff/domain/repositories/staff-member.repository';
import { StaffAssignmentRepository } from '../../../staff/domain/repositories/staff-assignment.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import { VendorRepository } from '../../../vendor/domain/repositories/vendor.repository';
import type {
  AnalyticsCustomersDto,
  AnalyticsDashboardDto,
  AnalyticsExportDto,
  AnalyticsFinanceDto,
  AnalyticsInventoryDto,
  AnalyticsOperationsDto,
  AnalyticsSalesDto,
  AnalyticsStaffDto,
  AnalyticsTrendsDto,
  AnalyticsVendorsDto,
  MoneyAmountDto,
} from '../dtos/analytics.dto';

const CURRENCY = 'INR';
const CONVERTED_LEAD_STAGES = new Set(['approved', 'completed']);
const ACTIVE_BOOKING_STATUSES = new Set([
  'approved',
  'in_preparation',
  'in_execution',
]);
const PROCUREMENT_OPEN = new Set([
  'draft',
  'quotation_requested',
  'quotation_received',
  'approved',
  'purchase_ordered',
  'vendor_confirmed',
  'materials_delivered',
]);
const DORMANT_DAYS = 180;

export type AnalyticsPeriodParams = {
  from?: string;
  to?: string;
};

export type AnalyticsTrendsParams = AnalyticsPeriodParams & {
  granularity?: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

export type AnalyticsExportParams = AnalyticsPeriodParams & {
  dataset:
    | 'dashboard'
    | 'sales'
    | 'finance'
    | 'staff'
    | 'vendors'
    | 'inventory'
    | 'customers'
    | 'operations'
    | 'trends';
  format?: 'csv' | 'xlsx';
};

function money(amount: number): MoneyAmountDto {
  return { amount, currency: CURRENCY };
}

function startOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
}

function toMonthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function parsePeriod(params: AnalyticsPeriodParams): {
  from: Date;
  to: Date;
} {
  const to = params.to ? new Date(params.to) : new Date();
  const from = params.from
    ? new Date(params.from)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return {
    from: Number.isNaN(from.getTime())
      ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      : from,
    to: Number.isNaN(to.getTime()) ? new Date() : to,
  };
}

function inRange(d: Date | null | undefined, from: Date, to: Date): boolean {
  if (!d) return false;
  return d.getTime() >= from.getTime() && d.getTime() <= to.getTime();
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) /
      (24 * 60 * 60 * 1000),
  );
}

function stringifyCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function escapeCsv(value: unknown): string {
  const raw = stringifyCell(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
  ];
  return lines.join('\n');
}

// Minimal XLSX (SpreadsheetML) so Excel can open without a binary dependency.
function toSpreadsheetMl(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) {
    return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"></Workbook>`;
  }
  const headers = Object.keys(rows[0]);
  const headerRow = `<Row>${headers
    .map((h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`)
    .join('')}</Row>`;
  const dataRows = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const v = row[h];
          const isNum = typeof v === 'number' && Number.isFinite(v);
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(
            stringifyCell(v),
          )}</Data></Cell>`;
        })
        .join('');
      return `<Row>${cells}</Row>`;
    })
    .join('');
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Analytics">
  <Table>
   ${headerRow}
   ${dataRows}
  </Table>
 </Worksheet>
</Workbook>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// P2-12 — Read-only BI aggregation; no write ownership
@Injectable()
export class AnalyticsApplicationService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly eventRepository: EventRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly vendorExpenseRepository: VendorExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly financialDocumentRepository: FinancialDocumentRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly inventoryItemRepository: InventoryItemRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly inventoryReservationRepository: InventoryReservationRepository,
    private readonly staffMemberRepository: StaffMemberRepository,
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly staffLeaveRepository: StaffLeaveRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
    private readonly schedulingService: SchedulingApplicationService,
  ) {}

  async getDashboard(
    tenantId: string,
    params: AnalyticsPeriodParams = {},
  ): Promise<Result<AnalyticsDashboardDto>> {
    const { from, to } = parsePeriod(params);
    const monthStart = new Date(
      Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1),
    );

    const [
      payments,
      expenses,
      events,
      leads,
      customers,
      reminders,
      procurements,
      staffResult,
      invoices,
      items,
      movements,
    ] = await Promise.all([
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
      this.leadRepository.findAll(tenantId),
      this.customerRepository.findAll(tenantId),
      this.reminderRepository.findAll(tenantId),
      this.vendorProcurementRepository.findAll(tenantId),
      this.schedulingService.getWorkload(tenantId),
      this.invoiceRepository.findAll(tenantId),
      this.inventoryItemRepository.findMany(tenantId),
      this.inventoryMovementRepository.findAll(tenantId),
    ]);

    const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
    const totalRevenue = confirmedPayments.reduce((s, p) => s + p.amount, 0);
    const monthlyRevenue = confirmedPayments
      .filter((p) => inRange(p.receivedAt, monthStart, to))
      .reduce((s, p) => s + p.amount, 0);
    const monthlyExpenses = expenses
      .filter(
        (e) => e.status === 'confirmed' && inRange(e.paidAt, monthStart, to),
      )
      .reduce((s, p) => s + p.amount, 0);

    const outstanding = invoices
      .filter((i) => i.status === 'sent' || i.status === 'partially_paid')
      .reduce((s, i) => s + i.totalAmount, 0);
    const paidAgainstOpen = confirmedPayments
      .filter((p) => p.invoiceId != null)
      .reduce((s, p) => s + p.amount, 0);

    const activeBookings = events.filter((e) =>
      ACTIVE_BOOKING_STATUSES.has(e.status),
    ).length;
    const upcomingEvents = events.filter(
      (e) =>
        e.eventStartDate &&
        e.eventStartDate >= startOfDay(new Date()) &&
        e.status !== 'cancelled',
    ).length;

    const leadsInPeriod = leads.filter((l) => inRange(l.createdAt, from, to));
    const converted = leadsInPeriod.filter((l) =>
      CONVERTED_LEAD_STAGES.has(l.stage),
    ).length;

    const bookingsByCustomer = new Map<string, number>();
    for (const e of events) {
      bookingsByCustomer.set(
        e.customerId,
        (bookingsByCustomer.get(e.customerId) ?? 0) + 1,
      );
    }
    const returning = [...bookingsByCustomer.values()].filter(
      (n) => n >= 2,
    ).length;
    const retention = customers.length > 0 ? returning / customers.length : 0;

    const workload = staffResult.ok ? staffResult.value : [];
    const busy = workload.filter((w) => w.eventsThisMonth > 0).length;
    const staffUtilisation = workload.length > 0 ? busy / workload.length : 0;

    const completedProcurements = procurements.filter(
      (p) => p.workflowStatus === 'completed',
    ).length;
    const vendorCompletion =
      procurements.length > 0 ? completedProcurements / procurements.length : 0;

    const totalStock = items.reduce((s, i) => s + i.quantityAtJpNagar, 0);
    const reservedQty = movements
      .filter((m) => !['cancelled', 'cleaned_ready'].includes(m.status))
      .reduce((s, m) => s + m.quantity, 0);
    const inventoryUtilisation =
      totalStock > 0 ? Math.min(1, reservedQty / totalStock) : 0;

    return success({
      currency: CURRENCY,
      totalRevenue: money(totalRevenue),
      outstandingPayments: money(Math.max(0, outstanding - paidAgainstOpen)),
      monthlyRevenue: money(monthlyRevenue),
      monthlyProfit: money(monthlyRevenue - monthlyExpenses),
      monthlyExpenses: money(monthlyExpenses),
      activeBookings,
      upcomingEvents,
      leadConversionRate:
        leadsInPeriod.length > 0 ? converted / leadsInPeriod.length : 0,
      customerRetentionRate: retention,
      staffUtilisationRate: staffUtilisation,
      vendorCompletionRate: vendorCompletion,
      inventoryUtilisationRate: inventoryUtilisation,
      counts: {
        leads: leads.length,
        customers: customers.length,
        bookings: events.length,
        pendingReminders: reminders.filter((r) => r.status === 'pending')
          .length,
        pendingProcurements: procurements.filter((p) =>
          PROCUREMENT_OPEN.has(p.workflowStatus),
        ).length,
      },
    });
  }

  async getSales(
    tenantId: string,
    params: AnalyticsPeriodParams = {},
  ): Promise<Result<AnalyticsSalesDto>> {
    const { from, to } = parsePeriod(params);
    const [leads, quotations, events, payments] = await Promise.all([
      this.leadRepository.findAll(tenantId),
      this.quotationRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
      this.paymentRepository.findAll(tenantId),
    ]);

    const leadsCreated = leads.filter((l) =>
      inRange(l.createdAt, from, to),
    ).length;
    const leadsConverted = leads.filter(
      (l) =>
        CONVERTED_LEAD_STAGES.has(l.stage) && inRange(l.updatedAt, from, to),
    ).length;
    const lostLeads = leads.filter(
      (l) => l.stage === 'lost' && inRange(l.updatedAt, from, to),
    ).length;

    const quotesInPeriod = quotations.filter((q) =>
      inRange(q.createdAt, from, to),
    );
    const accepted = quotesInPeriod.filter(
      (q) => q.status === 'approved',
    ).length;
    const decided = quotesInPeriod.filter((q) =>
      ['approved', 'rejected', 'expired'].includes(q.status),
    ).length;

    const byStage: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    for (const lead of leads) {
      byStage[lead.stage] = (byStage[lead.stage] ?? 0) + 1;
      bySource[lead.source] = (bySource[lead.source] ?? 0) + 1;
    }

    const confirmed = payments.filter((p) => p.status === 'confirmed');
    const revenueByEventTypeMap = new Map<string, number>();
    const eventById = new Map(events.map((e) => [e.id, e]));
    for (const payment of confirmed) {
      if (!payment.bookingId) continue;
      const event = eventById.get(payment.bookingId);
      const type = event?.eventType ?? 'unknown';
      revenueByEventTypeMap.set(
        type,
        (revenueByEventTypeMap.get(type) ?? 0) + payment.amount,
      );
    }

    const revenueByMonthMap = new Map<string, number>();
    for (const payment of confirmed.filter((p) =>
      inRange(p.receivedAt, from, to),
    )) {
      const key = toMonthKey(payment.receivedAt);
      revenueByMonthMap.set(
        key,
        (revenueByMonthMap.get(key) ?? 0) + payment.amount,
      );
    }

    const completedBookings = events.filter((e) => e.status === 'completed');
    const bookingValues = completedBookings.map((e) => {
      return confirmed
        .filter((p) => p.bookingId === e.id)
        .reduce((s, p) => s + p.amount, 0);
    });
    const averageBookingValue =
      bookingValues.length > 0
        ? bookingValues.reduce((a, b) => a + b, 0) / bookingValues.length
        : 0;

    return success({
      leadsCreated,
      leadsConverted,
      conversionRate: leadsCreated > 0 ? leadsConverted / leadsCreated : 0,
      lostLeads,
      quoteAcceptanceRate: decided > 0 ? accepted / decided : 0,
      averageBookingValue: money(averageBookingValue),
      revenueByEventType: [...revenueByEventTypeMap.entries()]
        .map(([eventType, revenue]) => ({ eventType, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      revenueByMonth: [...revenueByMonthMap.entries()]
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      byStage,
      bySource,
    });
  }

  async getFinance(
    tenantId: string,
    params: AnalyticsPeriodParams = {},
  ): Promise<Result<AnalyticsFinanceDto>> {
    const { from, to } = parsePeriod(params);
    const [payments, expenses, invoices, procurements] = await Promise.all([
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
      this.invoiceRepository.findAll(tenantId),
      this.vendorProcurementRepository.findAll(tenantId),
    ]);

    const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
    const confirmedExpenses = expenses.filter((e) => e.status === 'confirmed');
    const revenue = confirmedPayments
      .filter((p) => inRange(p.receivedAt, from, to))
      .reduce((s, p) => s + p.amount, 0);
    const expenseTotal = confirmedExpenses
      .filter((e) => inRange(e.paidAt, from, to))
      .reduce((s, e) => s + e.amount, 0);

    const outstanding = invoices
      .filter((i) => i.status === 'sent' || i.status === 'partially_paid')
      .reduce((s, i) => s + i.totalAmount, 0);

    const months = new Set<string>();
    for (const p of confirmedPayments) months.add(toMonthKey(p.receivedAt));
    for (const e of confirmedExpenses) months.add(toMonthKey(e.paidAt));
    const paymentCollectionTrend = [...months]
      .sort()
      .filter((m) => {
        const [y, mo] = m.split('-').map(Number);
        const start = new Date(Date.UTC(y, mo - 1, 1));
        return start >= from && start <= to;
      })
      .map((month) => ({
        month,
        collected: confirmedPayments
          .filter((p) => toMonthKey(p.receivedAt) === month)
          .reduce((s, p) => s + p.amount, 0),
        expenses: confirmedExpenses
          .filter((e) => toMonthKey(e.paidAt) === month)
          .reduce((s, e) => s + e.amount, 0),
      }));

    const invoicesByStatus: Record<string, number> = {};
    for (const invoice of invoices) {
      invoicesByStatus[invoice.status] =
        (invoicesByStatus[invoice.status] ?? 0) + 1;
    }

    const estimated = procurements.reduce(
      (s, p) => s + (p.estimatedCost ?? 0),
      0,
    );
    const actual = procurements.reduce((s, p) => s + (p.actualCost ?? 0), 0);

    const procurementSpend = procurements
      .filter((p) => p.actualCost != null)
      .reduce((s, p) => s + (p.actualCost ?? 0), 0);

    return success({
      currency: CURRENCY,
      revenue: money(revenue),
      expenses: money(expenseTotal),
      grossProfit: money(revenue - expenseTotal),
      outstandingReceivables: money(outstanding),
      procurementSpend: money(procurementSpend),
      paymentCollectionTrend,
      invoicesByStatus,
      costVariance: {
        estimated,
        actual,
        variance: actual - estimated,
      },
    });
  }

  async getStaff(tenantId: string): Promise<Result<AnalyticsStaffDto>> {
    const [members, leaveAll, assignments, workloadResult] = await Promise.all([
      this.staffMemberRepository.findMany(tenantId),
      this.staffLeaveRepository.findApprovedInRange(
        tenantId,
        new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1)),
        new Date(Date.UTC(new Date().getUTCFullYear(), 11, 31)),
      ),
      this.staffAssignmentRepository.findAll(tenantId),
      this.schedulingService.getWorkload(tenantId),
    ]);

    // Also count requested leave via members' leave lists is hard without findAll —
    // approximate with approved leave length.
    const workload = workloadResult.ok ? workloadResult.value : [];
    const busy = workload.filter((w) => w.eventsThisMonth > 0).length;
    const activeStaff = members.filter((m) => m.status === 'active').length;

    return success({
      utilisationRate: workload.length > 0 ? busy / workload.length : 0,
      totalStaff: members.length,
      activeStaff,
      eventsAssigned: assignments.filter((a) => a.status === 'confirmed')
        .length,
      leaveSummary: {
        approved: leaveAll.length,
        requested: 0,
      },
      workload: workload.map((w) => ({
        staffMemberId: w.staffMemberId,
        name: w.name,
        eventsToday: w.eventsToday,
        eventsThisWeek: w.eventsThisWeek,
        eventsThisMonth: w.eventsThisMonth,
        upcomingConfirmed: w.upcomingConfirmed,
      })),
    });
  }

  async getVendors(tenantId: string): Promise<Result<AnalyticsVendorsDto>> {
    const [procurements, vendors] = await Promise.all([
      this.vendorProcurementRepository.findAll(tenantId),
      this.vendorRepository.findMany(tenantId),
    ]);

    const deliveryPerformance = {
      delivered: 0,
      pending: 0,
      partial: 0,
      cancelled: 0,
    };
    for (const p of procurements) {
      if (p.deliveryStatus === 'delivered') deliveryPerformance.delivered += 1;
      else if (p.deliveryStatus === 'pending') deliveryPerformance.pending += 1;
      else if (p.deliveryStatus === 'partial') deliveryPerformance.partial += 1;
      else if (p.deliveryStatus === 'cancelled')
        deliveryPerformance.cancelled += 1;
    }

    const completed = procurements.filter(
      (p) => p.workflowStatus === 'completed',
    ).length;

    const spendMap = new Map<string, { spend: number; procurements: number }>();
    for (const p of procurements) {
      const entry = spendMap.get(p.vendorId) ?? { spend: 0, procurements: 0 };
      entry.spend += p.actualCost ?? p.approvedCost ?? p.estimatedCost ?? 0;
      entry.procurements += 1;
      spendMap.set(p.vendorId, entry);
    }

    // Quote win rate: procurements that reached approved+ over those with quotes requested
    const quoted = procurements.filter((p) =>
      [
        'quotation_requested',
        'quotation_received',
        'approved',
        'purchase_ordered',
        'vendor_confirmed',
        'materials_delivered',
        'completed',
      ].includes(p.workflowStatus),
    ).length;
    const won = procurements.filter((p) =>
      [
        'approved',
        'purchase_ordered',
        'vendor_confirmed',
        'materials_delivered',
        'completed',
      ].includes(p.workflowStatus),
    ).length;

    void vendors;

    return success({
      totalProcurements: procurements.length,
      completionRate:
        procurements.length > 0 ? completed / procurements.length : 0,
      deliveryPerformance,
      spendByVendor: [...spendMap.entries()]
        .map(([vendorId, v]) => ({
          vendorId,
          spend: v.spend,
          procurements: v.procurements,
        }))
        .sort((a, b) => b.spend - a.spend),
      quoteWinRate: quoted > 0 ? won / quoted : 0,
    });
  }

  async getInventory(tenantId: string): Promise<Result<AnalyticsInventoryDto>> {
    const [movements, items, events] = await Promise.all([
      this.inventoryMovementRepository.findAll(tenantId),
      this.inventoryItemRepository.findMany(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
    ]);

    const reservations = (
      await Promise.all(
        events.map((e) =>
          this.inventoryReservationRepository.findByBookingId(tenantId, e.id),
        ),
      )
    ).flat();

    const movementsByStatus: Record<string, number> = {};
    for (const m of movements) {
      movementsByStatus[m.status] = (movementsByStatus[m.status] ?? 0) + 1;
    }

    const damageIncidents = movements.filter(
      (m) => (m.damagedQuantity ?? 0) > 0,
    ).length;

    const totalStock = items.reduce((s, i) => s + i.quantityAtJpNagar, 0);
    const activeQty = movements
      .filter((m) => !['cancelled', 'cleaned_ready'].includes(m.status))
      .reduce((s, m) => s + m.quantity, 0);

    const dispatchMap = new Map<
      string,
      { dispatched: number; returned: number }
    >();
    for (const m of movements) {
      if (m.dispatchedAt) {
        const key = toMonthKey(m.dispatchedAt);
        const entry = dispatchMap.get(key) ?? { dispatched: 0, returned: 0 };
        entry.dispatched += 1;
        dispatchMap.set(key, entry);
      }
      if (m.returnedAt) {
        const key = toMonthKey(m.returnedAt);
        const entry = dispatchMap.get(key) ?? { dispatched: 0, returned: 0 };
        entry.returned += 1;
        dispatchMap.set(key, entry);
      }
    }

    return success({
      reservations: reservations.length,
      activeReservations: reservations.filter((r) => r.status === 'reserved')
        .length,
      usageMovements: movements.length,
      damageIncidents,
      stockAvailabilityRate:
        totalStock > 0 ? Math.max(0, 1 - activeQty / totalStock) : 1,
      dispatchTrends: [...dispatchMap.entries()]
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => a.month.localeCompare(b.month)),
      movementsByStatus,
    });
  }

  async getCustomers(
    tenantId: string,
    params: AnalyticsPeriodParams = {},
  ): Promise<Result<AnalyticsCustomersDto>> {
    const { from, to } = parsePeriod(params);
    const [customers, events, communications, reminders] = await Promise.all([
      this.customerRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
      this.communicationRecordRepository.findAll(tenantId),
      this.reminderRepository.findAll(tenantId),
    ]);

    const newCustomers = customers.filter((c) =>
      inRange(c.createdAt, from, to),
    ).length;

    const bookingsByCustomer = new Map<string, typeof events>();
    for (const e of events) {
      const list = bookingsByCustomer.get(e.customerId) ?? [];
      list.push(e);
      bookingsByCustomer.set(e.customerId, list);
    }

    let returningCustomers = 0;
    const healthDistribution = {
      active: 0,
      returning: 0,
      dormant: 0,
      follow_up_required: 0,
    };
    const now = new Date();

    for (const customer of customers) {
      const customerEvents = bookingsByCustomer.get(customer.id) ?? [];
      if (customerEvents.length >= 2) returningCustomers += 1;

      const customerComms = communications.filter(
        (c) => c.customerId === customer.id,
      );
      const customerReminders = reminders.filter(
        (r) => r.customerId === customer.id,
      );
      const lastInteraction =
        [
          ...customerComms.map((c) => c.occurredAt),
          ...customerEvents.map((e) => e.updatedAt),
          customer.updatedAt,
        ]
          .sort((a, b) => a.getTime() - b.getTime())
          .pop() ?? null;

      const hasFailed = customerComms.some((c) => c.status === 'failed');
      const hasOverdue = customerReminders.some(
        (r) => r.status === 'pending' && r.dueAt < now,
      );
      const hasActive = customerEvents.some((e) =>
        ACTIVE_BOOKING_STATUSES.has(e.status),
      );

      if (hasFailed || hasOverdue) healthDistribution.follow_up_required += 1;
      else if (hasActive) healthDistribution.active += 1;
      else if (customerEvents.length >= 2) healthDistribution.returning += 1;
      else if (
        lastInteraction &&
        daysBetween(lastInteraction, now) >= DORMANT_DAYS
      ) {
        healthDistribution.dormant += 1;
      } else healthDistribution.active += 1;
    }

    const eventTypeDistributionMap = new Map<string, number>();
    for (const e of events) {
      const type = e.eventType ?? 'unknown';
      eventTypeDistributionMap.set(
        type,
        (eventTypeDistributionMap.get(type) ?? 0) + 1,
      );
    }

    const channelMap = new Map<string, number>();
    for (const c of communications.filter((x) =>
      inRange(x.occurredAt, from, to),
    )) {
      channelMap.set(c.channel, (channelMap.get(c.channel) ?? 0) + 1);
    }

    return success({
      newCustomers,
      returningCustomers,
      repeatRate:
        customers.length > 0 ? returningCustomers / customers.length : 0,
      eventTypeDistribution: [...eventTypeDistributionMap.entries()]
        .map(([eventType, count]) => ({ eventType, count }))
        .sort((a, b) => b.count - a.count),
      communicationTrends: [...channelMap.entries()]
        .map(([channel, count]) => ({ channel, count }))
        .sort((a, b) => b.count - a.count),
      healthDistribution,
      totalCustomers: customers.length,
    });
  }

  async getOperations(
    tenantId: string,
  ): Promise<Result<AnalyticsOperationsDto>> {
    const today = startOfDay(new Date());

    const [events, reminders, procurements, movements] = await Promise.all([
      this.eventRepository.findByEventDate(tenantId, {}),
      this.reminderRepository.findAll(tenantId),
      this.vendorProcurementRepository.findAll(tenantId),
      this.inventoryMovementRepository.findAll(tenantId),
    ]);

    // P2-13 — compute ops counters locally; avoid nested Calendar planning fan-out.
    const todaysEvents = events.filter((e) => {
      if (!e.eventStartDate) return false;
      const start = startOfDay(e.eventStartDate);
      const end = e.eventEndDate ? startOfDay(e.eventEndDate) : start;
      return start <= today && end >= today && e.status !== 'cancelled';
    }).length;

    const upcomingEvents = events.filter(
      (e) =>
        e.eventStartDate &&
        startOfDay(e.eventStartDate) > today &&
        e.status !== 'cancelled',
    ).length;

    const pendingReminders = reminders.filter((r) => r.status === 'pending');
    const overdueReminders = pendingReminders.filter((r) => r.dueAt < today);

    const documents = (
      await Promise.all(
        events
          .slice(0, 100)
          .map((e) =>
            this.financialDocumentRepository.findByBookingId(tenantId, e.id),
          ),
      )
    )
      .flat()
      .filter((d) => !d.deletedAt && d.verificationStatus === 'pending');

    return success({
      todaysEvents,
      upcomingEvents,
      overdueTasks: overdueReminders.length,
      pendingProcurements: procurements.filter((p) =>
        PROCUREMENT_OPEN.has(p.workflowStatus),
      ).length,
      pendingReminders: pendingReminders.length,
      overdueReminders: overdueReminders.length,
      inventoryIssues: movements.filter(
        (m) => (m.damagedQuantity ?? 0) > 0 || (m.missingQuantity ?? 0) > 0,
      ).length,
      outstandingDocuments: documents.length,
      activeBookings: events.filter((e) =>
        ACTIVE_BOOKING_STATUSES.has(e.status),
      ).length,
    });
  }

  async getTrends(
    tenantId: string,
    params: AnalyticsTrendsParams = {},
  ): Promise<Result<AnalyticsTrendsDto>> {
    const granularity = params.granularity ?? 'monthly';
    const { from, to } = parsePeriod(params);

    const [payments, expenses, leads, events, customers] = await Promise.all([
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
      this.leadRepository.findAll(tenantId),
      this.eventRepository.findByEventDate(tenantId, {}),
      this.customerRepository.findAll(tenantId),
    ]);

    const buckets = this.buildTrendBuckets(from, to, granularity);
    const points = buckets.map((bucket) => {
      const revenue = payments
        .filter(
          (p) =>
            p.status === 'confirmed' &&
            inRange(p.receivedAt, bucket.start, bucket.end),
        )
        .reduce((s, p) => s + p.amount, 0);
      const expenseTotal = expenses
        .filter(
          (e) =>
            e.status === 'confirmed' &&
            inRange(e.paidAt, bucket.start, bucket.end),
        )
        .reduce((s, e) => s + e.amount, 0);
      return {
        period: bucket.label,
        revenue,
        expenses: expenseTotal,
        leads: leads.filter((l) =>
          inRange(l.createdAt, bucket.start, bucket.end),
        ).length,
        bookings: events.filter((e) =>
          inRange(e.createdAt, bucket.start, bucket.end),
        ).length,
        customers: customers.filter((c) =>
          inRange(c.createdAt, bucket.start, bucket.end),
        ).length,
      };
    });

    return success({ granularity, points });
  }

  async exportDataset(
    tenantId: string,
    params: AnalyticsExportParams,
  ): Promise<Result<AnalyticsExportDto>> {
    const format = params.format ?? 'csv';
    if (format !== 'csv' && format !== 'xlsx') {
      return failure('VALIDATION_ERROR', 'format must be csv or xlsx.');
    }

    let rows: Record<string, unknown>[] = [];
    switch (params.dataset) {
      case 'dashboard': {
        const result = await this.getDashboard(tenantId, params);
        if (!result.ok) return result;
        rows = [result.value];
        break;
      }
      case 'sales': {
        const result = await this.getSales(tenantId, params);
        if (!result.ok) return result;
        rows = result.value.revenueByMonth.map((r) => ({ ...r }));
        if (rows.length === 0) {
          rows = [
            {
              leadsCreated: result.value.leadsCreated,
              leadsConverted: result.value.leadsConverted,
              conversionRate: result.value.conversionRate,
              lostLeads: result.value.lostLeads,
              quoteAcceptanceRate: result.value.quoteAcceptanceRate,
              averageBookingValue: result.value.averageBookingValue.amount,
            },
          ];
        }
        break;
      }
      case 'finance': {
        const result = await this.getFinance(tenantId, params);
        if (!result.ok) return result;
        rows = result.value.paymentCollectionTrend.map((r) => ({ ...r }));
        if (rows.length === 0) {
          rows = [
            {
              revenue: result.value.revenue.amount,
              expenses: result.value.expenses.amount,
              grossProfit: result.value.grossProfit.amount,
              outstanding: result.value.outstandingReceivables.amount,
            },
          ];
        }
        break;
      }
      case 'staff': {
        const result = await this.getStaff(tenantId);
        if (!result.ok) return result;
        rows = result.value.workload.map((w) => ({ ...w }));
        break;
      }
      case 'vendors': {
        const result = await this.getVendors(tenantId);
        if (!result.ok) return result;
        rows = result.value.spendByVendor.map((v) => ({ ...v }));
        break;
      }
      case 'inventory': {
        const result = await this.getInventory(tenantId);
        if (!result.ok) return result;
        rows = result.value.dispatchTrends.map((d) => ({ ...d }));
        if (rows.length === 0) {
          rows = [
            {
              reservations: result.value.reservations,
              usageMovements: result.value.usageMovements,
              damageIncidents: result.value.damageIncidents,
            },
          ];
        }
        break;
      }
      case 'customers': {
        const result = await this.getCustomers(tenantId, params);
        if (!result.ok) return result;
        rows = result.value.eventTypeDistribution.map((e) => ({ ...e }));
        break;
      }
      case 'operations': {
        const result = await this.getOperations(tenantId);
        if (!result.ok) return result;
        rows = [result.value];
        break;
      }
      case 'trends': {
        const result = await this.getTrends(tenantId, params);
        if (!result.ok) return result;
        rows = result.value.points.map((p) => ({ ...p }));
        break;
      }
      default:
        return failure('VALIDATION_ERROR', 'Unknown export dataset.');
    }

    const stamp = new Date().toISOString().slice(0, 10);
    if (format === 'csv') {
      return success({
        dataset: params.dataset,
        format,
        fileName: `analytics-${params.dataset}-${stamp}.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: toCsv(rows),
        rowCount: rows.length,
      });
    }

    const xml = toSpreadsheetMl(rows);
    return success({
      dataset: params.dataset,
      format,
      fileName: `analytics-${params.dataset}-${stamp}.xls`,
      contentType: 'application/vnd.ms-excel',
      content: Buffer.from(xml, 'utf8').toString('base64'),
      rowCount: rows.length,
    });
  }

  private buildTrendBuckets(
    from: Date,
    to: Date,
    granularity: 'daily' | 'weekly' | 'monthly' | 'yearly',
  ): Array<{ label: string; start: Date; end: Date }> {
    const buckets: Array<{ label: string; start: Date; end: Date }> = [];
    let cursor = startOfDay(from);
    const end = startOfDay(to);

    while (cursor <= end) {
      if (granularity === 'daily') {
        const next = new Date(cursor);
        next.setUTCDate(next.getUTCDate() + 1);
        buckets.push({
          label: cursor.toISOString().slice(0, 10),
          start: cursor,
          end: new Date(next.getTime() - 1),
        });
        cursor = next;
      } else if (granularity === 'weekly') {
        const next = new Date(cursor);
        next.setUTCDate(next.getUTCDate() + 7);
        buckets.push({
          label: `W${cursor.toISOString().slice(0, 10)}`,
          start: cursor,
          end: new Date(Math.min(next.getTime() - 1, end.getTime())),
        });
        cursor = next;
      } else if (granularity === 'yearly') {
        const next = new Date(Date.UTC(cursor.getUTCFullYear() + 1, 0, 1));
        buckets.push({
          label: String(cursor.getUTCFullYear()),
          start: cursor,
          end: new Date(Math.min(next.getTime() - 1, end.getTime())),
        });
        cursor = next;
      } else {
        const next = new Date(
          Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
        );
        buckets.push({
          label: toMonthKey(cursor),
          start: cursor,
          end: new Date(Math.min(next.getTime() - 1, end.getTime())),
        });
        cursor = next;
      }
      if (buckets.length > 120) break;
    }
    return buckets;
  }
}
