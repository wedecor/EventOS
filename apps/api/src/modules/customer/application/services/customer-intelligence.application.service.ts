import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../../communication/domain/repositories/reminder.repository';
import { FinancialDocumentRepository } from '../../../finance/domain/repositories/financial-document.repository';
import { InvoiceRepository } from '../../../finance/domain/repositories/invoice.repository';
import { FollowUpRepository } from '../../../lead/domain/repositories/follow-up.repository';
import { LeadRepository } from '../../../lead/domain/repositories/lead.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { QuotationRepository } from '../../../quotation/domain/repositories/quotation.repository';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CustomerRepository } from '../../domain/repositories/customer.repository';
import { TimelineEntryRepository } from '../../domain/repositories/timeline-entry.repository';
import type {
  CustomerBookingHistoryItemDto,
  CustomerCommunicationsSummaryDto,
  CustomerFinancialSummaryDto,
  CustomerHealthStatus,
  CustomerOverviewDto,
  CustomerRelationshipDto,
  CustomerTimelineItemDto,
} from '../dtos/customer-intelligence.dto';

const ACTIVE_BOOKING_STATUSES = new Set([
  'approved',
  'in_preparation',
  'in_execution',
]);

const DORMANT_DAYS = 180;

function toIso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function toDateKey(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function daysBetween(from: Date, to: Date): number {
  const a = Date.UTC(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
  );
  const b = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

function mode(values: string[]): string | null {
  if (values.length === 0) return null;
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function topN(values: string[], n: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([k]) => k);
}

// P2-11 — Read-only Customer 360 aggregation; no write ownership
@Injectable()
export class CustomerIntelligenceApplicationService {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly contactRepository: ContactRepository,
    private readonly timelineEntryRepository: TimelineEntryRepository,
    private readonly leadRepository: LeadRepository,
    private readonly followUpRepository: FollowUpRepository,
    private readonly quotationRepository: QuotationRepository,
    private readonly eventRepository: EventRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
    private readonly reminderRepository: ReminderRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly financialDocumentRepository: FinancialDocumentRepository,
  ) {}

  async getOverview(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerOverviewDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [contacts, events, timeline, communications, reminders] =
      await Promise.all([
        this.contactRepository.findByCustomerId(tenantId, customerId),
        this.eventRepository.findByCustomerId(tenantId, customerId),
        this.timelineEntryRepository.findByCustomerId(tenantId, customerId),
        this.communicationRecordRepository.findByCustomerId(
          tenantId,
          customerId,
        ),
        this.reminderRepository.findByCustomerId(tenantId, customerId),
      ]);

    const interactionDates: Date[] = [
      customer.createdAt,
      ...timeline.map((t) => t.occurredAt),
      ...communications.map((c) => c.occurredAt),
      ...events
        .map((e) => e.createdAt)
        .filter((d): d is Date => d instanceof Date),
    ];
    interactionDates.sort((a, b) => a.getTime() - b.getTime());

    const firstInteractionAt = interactionDates[0] ?? null;
    const lastInteractionAt =
      interactionDates[interactionDates.length - 1] ?? null;

    const activeBookings = events.filter((e) =>
      ACTIVE_BOOKING_STATUSES.has(e.status),
    ).length;

    const health = this.deriveHealth({
      events,
      communications,
      reminders,
      lastInteractionAt,
    });

    return success({
      customerId: customer.id,
      displayName: customer.displayName,
      type: customer.type,
      status: customer.status,
      primaryPhone: customer.primaryPhone,
      primaryEmail: customer.primaryEmail,
      notes: customer.notes,
      contacts: contacts.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        phone: c.phone,
        email: c.email,
      })),
      firstInteractionAt: toIso(firstInteractionAt),
      lastInteractionAt: toIso(lastInteractionAt),
      totalEvents: events.length,
      activeBookings,
      health,
      deepLinks: {
        calendar: `/app/calendar/?customerId=${customerId}`,
        communications: `/app/communications/?customerId=${customerId}`,
        finance: `/app/finance/?customerId=${customerId}`,
      },
    });
  }

  async getTimeline(
    tenantId: string,
    customerId: string,
    options?: { from?: string; to?: string; sources?: string[] },
  ): Promise<Result<CustomerTimelineItemDto[]>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [
      leads,
      quotations,
      events,
      communications,
      reminders,
      timelineEntries,
      invoices,
    ] = await Promise.all([
      this.leadRepository.findByCustomerId(tenantId, customerId),
      this.quotationRepository.findByCustomerId(tenantId, customerId),
      this.eventRepository.findByCustomerId(tenantId, customerId),
      this.communicationRecordRepository.findByCustomerId(tenantId, customerId),
      this.reminderRepository.findByCustomerId(tenantId, customerId),
      this.timelineEntryRepository.findByCustomerId(tenantId, customerId),
      this.invoiceRepository.findByCustomerId(tenantId, customerId),
    ]);

    const followUps = await this.followUpRepository.findByLeadIds(
      tenantId,
      leads.map((l) => l.id),
    );

    const bookingIds = events.map((e) => e.id);
    const payments = (
      await Promise.all(
        bookingIds.map((id) =>
          this.paymentRepository.findByBookingId(tenantId, id),
        ),
      )
    ).flat();

    const documents = (
      await Promise.all(
        bookingIds.map((id) =>
          this.financialDocumentRepository.findByBookingId(tenantId, id),
        ),
      )
    ).flat();

    const items: CustomerTimelineItemDto[] = [];

    for (const lead of leads) {
      items.push({
        id: `lead-created-${lead.id}`,
        source: 'lead',
        title: `Lead created · ${lead.stage}`,
        occurredAt: lead.createdAt.toISOString(),
        status: lead.stage,
        leadId: lead.id,
        hrefHint: `/app/leads/view/?id=${lead.id}`,
        meta: { source: lead.source },
      });
    }

    for (const followUp of followUps) {
      items.push({
        id: `follow-up-${followUp.id}`,
        source: 'follow_up',
        title: `Follow-up · ${followUp.status}`,
        occurredAt: followUp.dueAt.toISOString(),
        status: followUp.status,
        leadId: followUp.leadId,
        hrefHint: `/app/leads/view/?id=${followUp.leadId}`,
        meta: { notes: followUp.notes },
      });
    }

    for (const quotation of quotations) {
      items.push({
        id: `quotation-${quotation.id}`,
        source: 'quotation',
        title: `Quotation Q-${quotation.quotationNumber} r${quotation.revisionNumber}`,
        occurredAt: quotation.createdAt.toISOString(),
        status: quotation.status,
        quotationId: quotation.id,
        leadId: quotation.leadId,
        hrefHint: `/app/quotations/view/?id=${quotation.id}`,
        meta: {
          totalAmount: quotation.totalAmount,
          currency: quotation.currency,
          eventType: quotation.eventType,
        },
      });
    }

    for (const event of events) {
      items.push({
        id: `booking-${event.id}`,
        source: 'booking',
        title: `Booking B-${event.bookingNumber} confirmed`,
        occurredAt: event.createdAt.toISOString(),
        status: event.status,
        bookingId: event.id,
        quotationId: event.quotationId,
        leadId: event.leadId,
        hrefHint: `/app/bookings/view/?id=${event.id}`,
        meta: {
          eventType: event.eventType,
          eventStartDate: event.eventStartDate
            ? toDateKey(event.eventStartDate)
            : null,
        },
      });
      if (event.eventStartDate) {
        items.push({
          id: `event-start-${event.id}`,
          source: 'event_milestone',
          title: `Event start · B-${event.bookingNumber}`,
          occurredAt: event.eventStartDate.toISOString(),
          status: event.status,
          bookingId: event.id,
          hrefHint: `/app/events/workspace/?id=${event.id}`,
          meta: { milestone: 'event_start' },
        });
      }
      if (event.completedAt) {
        items.push({
          id: `event-completed-${event.id}`,
          source: 'event_milestone',
          title: `Event completed · B-${event.bookingNumber}`,
          occurredAt: event.completedAt.toISOString(),
          status: event.status,
          bookingId: event.id,
          hrefHint: `/app/events/workspace/?id=${event.id}`,
          meta: { milestone: 'completed' },
        });
      }
    }

    for (const record of communications) {
      items.push({
        id: `communication-${record.id}`,
        source: 'communication',
        title: record.subject ?? `${record.channel} · ${record.status}`,
        occurredAt: record.occurredAt.toISOString(),
        status: record.status,
        bookingId: record.bookingId,
        hrefHint: `/app/communications/view/?id=${record.id}`,
        meta: { channel: record.channel, direction: record.direction },
      });
    }

    for (const payment of payments) {
      items.push({
        id: `payment-${payment.id}`,
        source: 'payment',
        title: `Payment · ${payment.amount} ${payment.currency}`,
        occurredAt: payment.receivedAt.toISOString(),
        status: payment.status,
        bookingId: payment.bookingId,
        quotationId: payment.quotationId,
        leadId: payment.leadId,
        hrefHint: payment.bookingId
          ? `/app/finance/booking/?id=${payment.bookingId}`
          : `/app/finance/`,
        meta: { method: payment.method, amount: payment.amount },
      });
    }

    for (const invoice of invoices) {
      items.push({
        id: `invoice-${invoice.id}`,
        source: 'payment',
        title: `Invoice INV-${invoice.invoiceNumber}`,
        occurredAt: (invoice.sentAt ?? invoice.createdAt).toISOString(),
        status: invoice.status,
        bookingId: invoice.bookingId,
        hrefHint: `/app/finance/booking/?id=${invoice.bookingId}`,
        meta: {
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          kind: 'invoice',
        },
      });
    }

    for (const doc of documents) {
      if (doc.deletedAt) continue;
      items.push({
        id: `financial-document-${doc.id}`,
        source: 'financial_document',
        title: doc.fileName ?? doc.documentType,
        occurredAt: doc.uploadedAt.toISOString(),
        status: doc.verificationStatus,
        bookingId: doc.bookingId,
        hrefHint: `/app/finance/booking/?id=${doc.bookingId}`,
        meta: { documentType: doc.documentType },
      });
    }

    for (const entry of timelineEntries) {
      items.push({
        id: `timeline-entry-${entry.id}`,
        source: 'timeline_entry',
        title: entry.message,
        occurredAt: entry.occurredAt.toISOString(),
        status: entry.type,
        bookingId: entry.eventId,
        hrefHint: `/app/customers/view/?id=${customerId}`,
        meta: { type: entry.type },
      });
    }

    for (const reminder of reminders) {
      items.push({
        id: `reminder-${reminder.id}`,
        source: 'reminder',
        title: reminder.title,
        occurredAt: reminder.dueAt.toISOString(),
        status: reminder.status,
        bookingId: reminder.bookingId,
        hrefHint: `/app/communications/reminders/`,
        meta: { category: reminder.category },
      });
    }

    let filtered = items;
    if (options?.sources && options.sources.length > 0) {
      const allowed = new Set(options.sources);
      filtered = filtered.filter((i) => allowed.has(i.source));
    }
    if (options?.from) {
      const from = new Date(options.from);
      if (!Number.isNaN(from.getTime())) {
        filtered = filtered.filter((i) => new Date(i.occurredAt) >= from);
      }
    }
    if (options?.to) {
      const to = new Date(options.to);
      if (!Number.isNaN(to.getTime())) {
        filtered = filtered.filter((i) => new Date(i.occurredAt) <= to);
      }
    }

    filtered.sort((a, b) => {
      const cmp = a.occurredAt.localeCompare(b.occurredAt);
      return cmp !== 0 ? cmp : a.id.localeCompare(b.id);
    });

    return success(filtered);
  }

  async getBookings(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerBookingHistoryItemDto[]>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [events, quotations] = await Promise.all([
      this.eventRepository.findByCustomerId(tenantId, customerId),
      this.quotationRepository.findByCustomerId(tenantId, customerId),
    ]);

    const quotationById = new Map(quotations.map((q) => [q.id, q]));

    const items: CustomerBookingHistoryItemDto[] = events.map((event) => {
      const quotation = quotationById.get(event.quotationId);
      let outcome = 'in_progress';
      if (event.status === 'completed') outcome = 'completed';
      else if (event.status === 'cancelled') outcome = 'cancelled';
      else if (ACTIVE_BOOKING_STATUSES.has(event.status))
        outcome = 'in_progress';
      else outcome = event.status;

      return {
        bookingId: event.id,
        bookingNumber: event.bookingNumber,
        eventType: event.eventType,
        eventStartDate: event.eventStartDate
          ? toDateKey(event.eventStartDate)
          : null,
        eventEndDate: event.eventEndDate ? toDateKey(event.eventEndDate) : null,
        status: event.status,
        venueName: event.venueName,
        quotationId: event.quotationId,
        value: quotation?.totalAmount ?? null,
        currency: quotation?.currency ?? null,
        outcome,
        hrefWorkspace: `/app/events/workspace/?id=${event.id}`,
        hrefCalendar: `/app/calendar/?bookingId=${event.id}`,
      };
    });

    items.sort((a, b) => {
      const aKey = a.eventStartDate ?? '';
      const bKey = b.eventStartDate ?? '';
      return bKey.localeCompare(aKey);
    });

    return success(items);
  }

  async getRelationship(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerRelationshipDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [events, communications, reminders, timeline] = await Promise.all([
      this.eventRepository.findByCustomerId(tenantId, customerId),
      this.communicationRecordRepository.findByCustomerId(tenantId, customerId),
      this.reminderRepository.findByCustomerId(tenantId, customerId),
      this.timelineEntryRepository.findByCustomerId(tenantId, customerId),
    ]);

    const bookingDates = events
      .map((e) => e.eventStartDate ?? e.createdAt)
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());

    const lastInteractionCandidates = [
      ...communications.map((c) => c.occurredAt),
      ...timeline.map((t) => t.occurredAt),
      ...events.map((e) => e.updatedAt),
      customer.updatedAt,
    ].sort((a, b) => a.getTime() - b.getTime());
    const lastInteractionAt =
      lastInteractionCandidates[lastInteractionCandidates.length - 1] ?? null;

    const health = this.deriveHealth({
      events,
      communications,
      reminders,
      lastInteractionAt,
    });

    const preferredEventTypes = topN(
      events
        .map((e) => e.eventType)
        .filter((t): t is string => typeof t === 'string' && t.length > 0),
      3,
    );

    return success({
      customerId,
      repeatCustomer: events.length >= 2,
      firstBookingDate: bookingDates[0] ? toDateKey(bookingDates[0]) : null,
      mostRecentBookingDate: bookingDates[bookingDates.length - 1]
        ? toDateKey(bookingDates[bookingDates.length - 1])
        : null,
      lifetimeBookingCount: events.length,
      completedBookingCount: events.filter((e) => e.status === 'completed')
        .length,
      cancelledBookingCount: events.filter((e) => e.status === 'cancelled')
        .length,
      preferredCommunicationChannel: mode(communications.map((c) => c.channel)),
      preferredEventTypes,
      health,
      indicators: {
        hasPendingReminders: reminders.some((r) => r.status === 'pending'),
        hasFailedCommunications: communications.some(
          (c) => c.status === 'failed',
        ),
        daysSinceLastInteraction: lastInteractionAt
          ? daysBetween(lastInteractionAt, new Date())
          : null,
      },
    });
  }

  async getFinancialSummary(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerFinancialSummaryDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [quotations, invoices, events] = await Promise.all([
      this.quotationRepository.findByCustomerId(tenantId, customerId),
      this.invoiceRepository.findByCustomerId(tenantId, customerId),
      this.eventRepository.findByCustomerId(tenantId, customerId),
    ]);

    const payments = (
      await Promise.all(
        events.map((e) =>
          this.paymentRepository.findByBookingId(tenantId, e.id),
        ),
      )
    ).flat();

    const documents = (
      await Promise.all(
        events.map((e) =>
          this.financialDocumentRepository.findByBookingId(tenantId, e.id),
        ),
      )
    )
      .flat()
      .filter((d) => !d.deletedAt);

    const quoted = quotations.filter(
      (q) => q.status !== 'superseded' && q.status !== 'rejected',
    );
    const totalQuoted = quoted.reduce((sum, q) => sum + q.totalAmount, 0);

    const activeInvoices = invoices.filter((i) => i.status !== 'void');
    const totalInvoiced = activeInvoices.reduce(
      (sum, i) => sum + i.totalAmount,
      0,
    );

    const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
    const totalPaid = confirmedPayments.reduce((sum, p) => sum + p.amount, 0);

    const currency =
      activeInvoices[0]?.currency ??
      quoted[0]?.currency ??
      confirmedPayments[0]?.currency ??
      'INR';

    return success({
      customerId,
      currency,
      totalQuoted,
      totalInvoiced,
      totalPaid,
      outstandingBalance: Math.max(0, totalInvoiced - totalPaid),
      quotationCount: quotations.length,
      invoiceCount: activeInvoices.length,
      paymentCount: confirmedPayments.length,
      documentCount: documents.length,
      documents: documents.map((d) => ({
        id: d.id,
        bookingId: d.bookingId,
        documentType: d.documentType,
        verificationStatus: d.verificationStatus,
        fileName: d.fileName,
        uploadedAt: d.uploadedAt.toISOString(),
        hrefHint: `/app/finance/booking/?id=${d.bookingId}`,
      })),
    });
  }

  async getCommunications(
    tenantId: string,
    customerId: string,
  ): Promise<Result<CustomerCommunicationsSummaryDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const [communications, reminders] = await Promise.all([
      this.communicationRecordRepository.findByCustomerId(tenantId, customerId),
      this.reminderRepository.findByCustomerId(tenantId, customerId),
    ]);

    const today = new Date();
    const channelCounts = new Map<string, number>();
    for (const c of communications) {
      channelCounts.set(c.channel, (channelCounts.get(c.channel) ?? 0) + 1);
    }

    const pendingReminders = reminders.filter((r) => r.status === 'pending');
    const overdueReminders = pendingReminders.filter((r) => r.dueAt < today);

    return success({
      customerId,
      total: communications.length,
      failed: communications.filter((c) => c.status === 'failed').length,
      pendingReminders: pendingReminders.length,
      overdueReminders: overdueReminders.length,
      channelUsage: [...channelCounts.entries()]
        .map(([channel, count]) => ({ channel, count }))
        .sort((a, b) => b.count - a.count),
      recent: [...communications]
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, 20)
        .map((c) => ({
          id: c.id,
          channel: c.channel,
          direction: c.direction,
          status: c.status,
          subject: c.subject,
          occurredAt: c.occurredAt.toISOString(),
          hrefHint: `/app/communications/view/?id=${c.id}`,
        })),
      reminders: reminders.map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        dueAt: r.dueAt.toISOString(),
        category: r.category,
        hrefHint: `/app/communications/reminders/`,
      })),
    });
  }

  private deriveHealth(input: {
    events: Array<{ status: string }>;
    communications: Array<{ status: string }>;
    reminders: Array<{ status: string; dueAt: Date }>;
    lastInteractionAt: Date | null;
  }): CustomerHealthStatus {
    const today = new Date();
    const hasActive = input.events.some((e) =>
      ACTIVE_BOOKING_STATUSES.has(e.status),
    );
    const hasFailedComms = input.communications.some(
      (c) => c.status === 'failed',
    );
    const hasOverdueReminder = input.reminders.some(
      (r) => r.status === 'pending' && r.dueAt < today,
    );

    if (hasFailedComms || hasOverdueReminder) {
      return 'follow_up_required';
    }
    if (hasActive) {
      return 'active';
    }
    if (input.events.length >= 2) {
      return 'returning';
    }
    if (
      input.lastInteractionAt &&
      daysBetween(input.lastInteractionAt, today) >= DORMANT_DAYS
    ) {
      return 'dormant';
    }
    if (input.events.length === 1) {
      return 'returning';
    }
    return 'active';
  }
}
