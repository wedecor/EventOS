import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ExpenseRecordedEvent,
  ExpenseVoidedEvent,
} from '../../../../shared/events/sprint5-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ProcurementLineRepository } from '../../../vendor/domain/repositories/procurement-line.repository';
import { VendorRepository } from '../../../vendor/domain/repositories/vendor.repository';
import { VendorExpenseRepository } from '../../domain/repositories/vendor-expense.repository';
import {
  toVendorExpenseDto,
  type VendorExpenseDto,
} from '../dtos/vendor-expense.dto';

export type RecordExpenseInput = {
  vendorId: string;
  procurementLineId?: string | null;
  amount: number;
  currency?: string;
  method: string;
  paidAt: Date;
  attachmentId?: string | null;
  notes?: string | null;
};

// EP1-FIN-004 — Vendor expenses captured per event. Human-recorded; no auto vendor payments
// (`07-domain-model.md` §VendorExpense invariant, `19-event-os-phase1-requirements.md` scope
// freeze). Mirrors `PaymentApplicationService.recordPayment()` precedent.
@Injectable()
export class VendorExpenseApplicationService {
  constructor(
    private readonly vendorExpenseRepository: VendorExpenseRepository,
    private readonly eventRepository: EventRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly procurementLineRepository: ProcurementLineRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async recordExpense(
    tenantId: string,
    bookingId: string,
    input: RecordExpenseInput,
  ): Promise<Result<VendorExpenseDto>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (input.amount <= 0) {
      return failure(
        'VALIDATION_ERROR',
        'Expense amount must be greater than zero.',
      );
    }

    const vendor = await this.vendorRepository.findById(
      tenantId,
      input.vendorId,
    );
    if (!vendor) {
      return failure('NOT_FOUND', 'Vendor not found.');
    }

    if (input.procurementLineId) {
      const procurementLine = await this.procurementLineRepository.findById(
        tenantId,
        input.procurementLineId,
      );
      if (!procurementLine) {
        return failure('NOT_FOUND', 'Procurement line not found.');
      }
      if (procurementLine.bookingId !== bookingId) {
        return failure(
          'VALIDATION_ERROR',
          'Procurement line does not belong to this booking.',
          { bookingId, procurementLineId: input.procurementLineId },
        );
      }
    }

    const expense = await this.vendorExpenseRepository.create(tenantId, {
      bookingId,
      vendorId: input.vendorId,
      procurementLineId: input.procurementLineId,
      amount: input.amount,
      currency: input.currency,
      method: input.method,
      paidAt: input.paidAt,
      attachmentId: input.attachmentId,
      notes: input.notes,
    });

    this.eventPublisher.publish(new ExpenseRecordedEvent(tenantId, expense));

    return success(toVendorExpenseDto(expense));
  }

  // EP1-FIN-004, EP1-FIN-005 — Event Workspace / profitability integration: expenses for a booking
  async listExpensesForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<VendorExpenseDto[]>> {
    const expenses = await this.vendorExpenseRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    return success(expenses.map(toVendorExpenseDto));
  }

  async voidExpense(
    tenantId: string,
    expenseId: string,
    version: number,
  ): Promise<Result<VendorExpenseDto>> {
    const existing = await this.vendorExpenseRepository.findById(
      tenantId,
      expenseId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Vendor expense not found.');
    }

    if (existing.status === 'void') {
      return failure('INVALID_STATE', 'Vendor expense is already void.', {
        status: existing.status,
      });
    }

    try {
      const expense = await this.vendorExpenseRepository.update(
        tenantId,
        expenseId,
        { status: 'void' },
        version,
      );

      this.eventPublisher.publish(new ExpenseVoidedEvent(tenantId, expense));

      return success(toVendorExpenseDto(expense));
    } catch (error: unknown) {
      return this.handleConcurrency(error, expenseId);
    }
  }

  private handleConcurrency<T>(error: unknown, expenseId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Vendor expense was modified by another request. Reload and retry.',
        { expenseId },
      );
    }

    throw error;
  }
}
