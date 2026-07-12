import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { VendorExpenseRepository } from '../../domain/repositories/vendor-expense.repository';
import type { ProfitabilityDto } from '../dtos/profitability.dto';

const DEFAULT_CURRENCY = 'INR';

// EP1-FIN-005 — Event profitability view: revenue minus vendor expenses per event
// (`07-domain-model.md` §EventProfitabilityView — "Computed view: customer revenue − vendor
// expenses per event... Not a mutable aggregate — derived from Payment, Invoice, and
// VendorExpense"). Implementation decision (per `10-implementation-specification.md` Sprint 5
// §7 risk note): revenue basis is the sum of *confirmed* Payments for the booking, not Invoice
// totals — Invoice creation is optional in Phase 1 (not every booking is invoiced), while a
// confirmed Payment is guaranteed to exist for every booking per EP1-BR-001. This avoids
// fabricating a KPI baseline for bookings that have no invoice yet.
@Injectable()
export class ProfitabilityApplicationService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly vendorExpenseRepository: VendorExpenseRepository,
  ) {}

  async getProfitability(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<ProfitabilityDto>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const [payments, expenses] = await Promise.all([
      this.paymentRepository.findByBookingId(tenantId, bookingId),
      this.vendorExpenseRepository.findByBookingId(tenantId, bookingId),
    ]);

    const revenue = payments
      .filter((payment) => payment.status === 'confirmed')
      .reduce((sum, payment) => sum + payment.amount, 0);

    const vendorExpenses = expenses
      .filter((expense) => expense.status === 'confirmed')
      .reduce((sum, expense) => sum + expense.amount, 0);

    return success({
      eventId: bookingId,
      revenue: { amount: revenue, currency: DEFAULT_CURRENCY },
      vendorExpenses: { amount: vendorExpenses, currency: DEFAULT_CURRENCY },
      grossMargin: {
        amount: revenue - vendorExpenses,
        currency: DEFAULT_CURRENCY,
      },
    });
  }
}
