import { z } from 'zod';

const isoString = z.string();

export const customerHealthSchema = z.enum([
  'active',
  'returning',
  'dormant',
  'follow_up_required',
]);

export const customerOverviewSchema = z.object({
  customerId: z.string().uuid(),
  displayName: z.string(),
  type: z.string(),
  status: z.string(),
  primaryPhone: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  notes: z.string().nullable(),
  contacts: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      role: z.string(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    }),
  ),
  firstInteractionAt: isoString.nullable(),
  lastInteractionAt: isoString.nullable(),
  totalEvents: z.number().int(),
  activeBookings: z.number().int(),
  health: customerHealthSchema,
  deepLinks: z.object({
    calendar: z.string(),
    communications: z.string(),
    finance: z.string(),
  }),
});

export const customerTimelineItemSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  occurredAt: isoString,
  status: z.string().nullable().optional(),
  bookingId: z.string().uuid().nullable().optional(),
  leadId: z.string().uuid().nullable().optional(),
  quotationId: z.string().uuid().nullable().optional(),
  hrefHint: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export const customerBookingHistoryItemSchema = z.object({
  bookingId: z.string().uuid(),
  bookingNumber: z.number().int(),
  eventType: z.string().nullable(),
  eventStartDate: z.string().nullable(),
  eventEndDate: z.string().nullable(),
  status: z.string(),
  venueName: z.string().nullable(),
  quotationId: z.string().uuid(),
  value: z.number().nullable(),
  currency: z.string().nullable(),
  outcome: z.string(),
  hrefWorkspace: z.string(),
  hrefCalendar: z.string(),
});

export const customerRelationshipSchema = z.object({
  customerId: z.string().uuid(),
  repeatCustomer: z.boolean(),
  firstBookingDate: z.string().nullable(),
  mostRecentBookingDate: z.string().nullable(),
  lifetimeBookingCount: z.number().int(),
  completedBookingCount: z.number().int(),
  cancelledBookingCount: z.number().int(),
  preferredCommunicationChannel: z.string().nullable(),
  preferredEventTypes: z.array(z.string()),
  health: customerHealthSchema,
  indicators: z.object({
    hasPendingReminders: z.boolean(),
    hasFailedCommunications: z.boolean(),
    daysSinceLastInteraction: z.number().nullable(),
  }),
});

export const customerFinancialSummarySchema = z.object({
  customerId: z.string().uuid(),
  currency: z.string(),
  totalQuoted: z.number(),
  totalInvoiced: z.number(),
  totalPaid: z.number(),
  outstandingBalance: z.number(),
  quotationCount: z.number().int(),
  invoiceCount: z.number().int(),
  paymentCount: z.number().int(),
  documentCount: z.number().int(),
  documents: z.array(
    z.object({
      id: z.string().uuid(),
      bookingId: z.string().uuid(),
      documentType: z.string(),
      verificationStatus: z.string(),
      fileName: z.string().nullable(),
      uploadedAt: isoString,
      hrefHint: z.string(),
    }),
  ),
});

export const customerCommunicationsSummarySchema = z.object({
  customerId: z.string().uuid(),
  total: z.number().int(),
  failed: z.number().int(),
  pendingReminders: z.number().int(),
  overdueReminders: z.number().int(),
  channelUsage: z.array(
    z.object({
      channel: z.string(),
      count: z.number().int(),
    }),
  ),
  recent: z.array(
    z.object({
      id: z.string().uuid(),
      channel: z.string(),
      direction: z.string(),
      status: z.string(),
      subject: z.string().nullable(),
      occurredAt: isoString,
      hrefHint: z.string(),
    }),
  ),
  reminders: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      status: z.string(),
      dueAt: isoString,
      category: z.string(),
      hrefHint: z.string(),
    }),
  ),
});

export type CustomerOverview = z.infer<typeof customerOverviewSchema>;
export type CustomerTimelineItem = z.infer<typeof customerTimelineItemSchema>;
export type CustomerBookingHistoryItem = z.infer<
  typeof customerBookingHistoryItemSchema
>;
export type CustomerRelationship = z.infer<typeof customerRelationshipSchema>;
export type CustomerFinancialSummary = z.infer<
  typeof customerFinancialSummarySchema
>;
export type CustomerCommunicationsSummary = z.infer<
  typeof customerCommunicationsSummarySchema
>;
export type CustomerHealth = z.infer<typeof customerHealthSchema>;

export function parseCustomerOverview(data: unknown): CustomerOverview {
  return customerOverviewSchema.parse(data);
}

export function parseCustomerTimeline(data: unknown): CustomerTimelineItem[] {
  return z.array(customerTimelineItemSchema).parse(data);
}

export function parseCustomerBookings(
  data: unknown,
): CustomerBookingHistoryItem[] {
  return z.array(customerBookingHistoryItemSchema).parse(data);
}

export function parseCustomerRelationship(data: unknown): CustomerRelationship {
  return customerRelationshipSchema.parse(data);
}

export function parseCustomerFinancialSummary(
  data: unknown,
): CustomerFinancialSummary {
  return customerFinancialSummarySchema.parse(data);
}

export function parseCustomerCommunications(
  data: unknown,
): CustomerCommunicationsSummary {
  return customerCommunicationsSummarySchema.parse(data);
}

export function formatHealthLabel(health: CustomerHealth): string {
  switch (health) {
    case 'follow_up_required':
      return 'Follow-up required';
    case 'returning':
      return 'Returning';
    case 'dormant':
      return 'Dormant';
    default:
      return 'Active';
  }
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
