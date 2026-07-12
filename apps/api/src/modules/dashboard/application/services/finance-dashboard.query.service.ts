import { Injectable } from '@nestjs/common';
import type { InvoiceStatus } from '@prisma/client';
import { success, type Result } from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { VendorExpenseRepository } from '../../../finance/domain/repositories/vendor-expense.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import type { FinanceSummaryDto } from '../dtos/finance-summary.dto';
import type { MonthlyRevenueSummaryDto } from '../dtos/monthly-revenue-summary.dto';
import type { PendingPaymentsDto } from '../dtos/pending-payments.dto';

const DEFAULT_CURRENCY = 'INR';
const DEFAULT_MONTHS = 6;
const PENDING_PAYMENT_EPSILON = 0.01;

// EP1-FIN-002–EP1-FIN-005, EP1-KPI-004 — Finance dashboards: confirmed revenue/expense/margin
// aggregation, monthly trend, and at-risk-event pending-payments visibility (I3, I5). Read-only;
// revenue/margin basis matches `ProfitabilityApplicationService` (confirmed payments minus
// confirmed vendor expenses) — no business logic duplication.
@Injectable()
export class FinanceDashboardQueryService {
  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly vendorExpenseRepository: VendorExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly eventRepository: EventRepository,
    private readonly quotationRepository: QuotationRepository,
  ) {}

  async getFinanceSummary(
    tenantId: string,
  ): Promise<Result<FinanceSummaryDto>> {
    const [payments, expenses, invoices] = await Promise.all([
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
      this.invoiceRepository.findAll(tenantId),
    ]);

    const revenue = payments
      .filter((payment) => payment.status === 'confirmed')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const vendorExpenseTotal = expenses
      .filter((expense) => expense.status === 'confirmed')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const byStatus: Partial<Record<InvoiceStatus, number>> = {};
    for (const invoice of invoices) {
      byStatus[invoice.status] = (byStatus[invoice.status] ?? 0) + 1;
    }

    return success({
      totalConfirmedRevenue: { amount: revenue, currency: DEFAULT_CURRENCY },
      totalConfirmedVendorExpenses: {
        amount: vendorExpenseTotal,
        currency: DEFAULT_CURRENCY,
      },
      grossMargin: {
        amount: revenue - vendorExpenseTotal,
        currency: DEFAULT_CURRENCY,
      },
      invoices: { total: invoices.length, byStatus },
    });
  }

  async getMonthlyRevenueSummary(
    tenantId: string,
    months: number = DEFAULT_MONTHS,
  ): Promise<Result<MonthlyRevenueSummaryDto>> {
    const [payments, expenses] = await Promise.all([
      this.paymentRepository.findAll(tenantId),
      this.vendorExpenseRepository.findAll(tenantId),
    ]);

    const confirmedPayments = payments.filter(
      (payment) => payment.status === 'confirmed',
    );
    const confirmedExpenses = expenses.filter(
      (expense) => expense.status === 'confirmed',
    );

    const monthKeys = this.buildMonthKeys(months);

    const points = monthKeys.map((month) => {
      const revenue = confirmedPayments
        .filter((payment) => this.toMonthKey(payment.receivedAt) === month)
        .reduce((sum, payment) => sum + payment.amount, 0);
      const vendorExpenseTotal = confirmedExpenses
        .filter((expense) => this.toMonthKey(expense.paidAt) === month)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        month,
        revenue: { amount: revenue, currency: DEFAULT_CURRENCY },
        vendorExpenses: {
          amount: vendorExpenseTotal,
          currency: DEFAULT_CURRENCY,
        },
        grossMargin: {
          amount: revenue - vendorExpenseTotal,
          currency: DEFAULT_CURRENCY,
        },
      };
    });

    return success({ months: points });
  }

  async getPendingPayments(
    tenantId: string,
  ): Promise<Result<PendingPaymentsDto>> {
    const events = await this.eventRepository.findByEventDate(tenantId, {});
    const activeEvents = events.filter((event) => event.status !== 'cancelled');

    const quotations = await this.quotationRepository.findByIds(
      tenantId,
      activeEvents.map((event) => event.quotationId),
    );
    const quotationById = new Map(
      quotations.map((quotation) => [quotation.id, quotation]),
    );

    const payments = await this.paymentRepository.findAll(tenantId);
    const confirmedPaidByBooking = new Map<string, number>();
    for (const payment of payments) {
      if (payment.status !== 'confirmed' || payment.bookingId === null) {
        continue;
      }
      confirmedPaidByBooking.set(
        payment.bookingId,
        (confirmedPaidByBooking.get(payment.bookingId) ?? 0) + payment.amount,
      );
    }

    const items = activeEvents
      .map((event) => {
        const quotation = quotationById.get(event.quotationId);
        const quotationTotal = quotation?.totalAmount ?? 0;
        const confirmedPaid = confirmedPaidByBooking.get(event.id) ?? 0;
        const amountDue = quotationTotal - confirmedPaid;

        return {
          bookingId: event.id,
          bookingNumber: event.bookingNumber,
          customerId: event.customerId,
          eventStartDate: event.eventStartDate,
          quotationTotal: {
            amount: quotationTotal,
            currency: quotation?.currency ?? DEFAULT_CURRENCY,
          },
          confirmedPaid: {
            amount: confirmedPaid,
            currency: quotation?.currency ?? DEFAULT_CURRENCY,
          },
          amountDue: {
            amount: amountDue,
            currency: quotation?.currency ?? DEFAULT_CURRENCY,
          },
        };
      })
      .filter((item) => item.amountDue.amount > PENDING_PAYMENT_EPSILON)
      .sort((a, b) => b.amountDue.amount - a.amountDue.amount);

    const totalDueAmount = items.reduce(
      (sum, item) => sum + item.amountDue.amount,
      0,
    );

    return success({
      totalDueAmount: { amount: totalDueAmount, currency: DEFAULT_CURRENCY },
      items,
    });
  }

  private buildMonthKeys(months: number): string[] {
    const now = new Date();
    const keys: string[] = [];

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      keys.push(this.toMonthKey(date));
    }

    return keys;
  }

  private toMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}
