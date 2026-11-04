/**
 * P2-11 — Customer 360° read models.
 * Customer Intelligence owns no operational state.
 */

export type CustomerHealthStatus =
  'active' | 'returning' | 'dormant' | 'follow_up_required';

export type CustomerOverviewDto = {
  customerId: string;
  displayName: string;
  type: string;
  status: string;
  primaryPhone: string | null;
  primaryEmail: string | null;
  notes: string | null;
  contacts: Array<{
    id: string;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
  }>;
  firstInteractionAt: string | null;
  lastInteractionAt: string | null;
  totalEvents: number;
  activeBookings: number;
  health: CustomerHealthStatus;
  deepLinks: {
    calendar: string;
    communications: string;
    finance: string;
  };
};

export type CustomerTimelineItemDto = {
  id: string;
  source:
    | 'lead'
    | 'follow_up'
    | 'quotation'
    | 'booking'
    | 'communication'
    | 'payment'
    | 'financial_document'
    | 'timeline_entry'
    | 'reminder'
    | 'event_milestone';
  title: string;
  occurredAt: string;
  status?: string | null;
  bookingId?: string | null;
  leadId?: string | null;
  quotationId?: string | null;
  hrefHint?: string | null;
  meta?: Record<string, unknown>;
};

export type CustomerBookingHistoryItemDto = {
  bookingId: string;
  bookingNumber: number;
  eventType: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  status: string;
  venueName: string | null;
  quotationId: string;
  /** Quotation total for this booking's quotation, if available */
  value: number | null;
  currency: string | null;
  outcome: string;
  hrefWorkspace: string;
  hrefCalendar: string;
};

export type CustomerRelationshipDto = {
  customerId: string;
  repeatCustomer: boolean;
  firstBookingDate: string | null;
  mostRecentBookingDate: string | null;
  lifetimeBookingCount: number;
  completedBookingCount: number;
  cancelledBookingCount: number;
  preferredCommunicationChannel: string | null;
  preferredEventTypes: string[];
  health: CustomerHealthStatus;
  indicators: {
    hasPendingReminders: boolean;
    hasFailedCommunications: boolean;
    daysSinceLastInteraction: number | null;
  };
};

export type CustomerFinancialSummaryDto = {
  customerId: string;
  currency: string;
  totalQuoted: number;
  totalInvoiced: number;
  totalPaid: number;
  outstandingBalance: number;
  quotationCount: number;
  invoiceCount: number;
  paymentCount: number;
  documentCount: number;
  documents: Array<{
    id: string;
    bookingId: string;
    documentType: string;
    verificationStatus: string;
    fileName: string | null;
    uploadedAt: string;
    hrefHint: string;
  }>;
};

export type CustomerCommunicationsSummaryDto = {
  customerId: string;
  total: number;
  failed: number;
  pendingReminders: number;
  overdueReminders: number;
  channelUsage: Array<{ channel: string; count: number }>;
  recent: Array<{
    id: string;
    channel: string;
    direction: string;
    status: string;
    subject: string | null;
    occurredAt: string;
    hrefHint: string;
  }>;
  reminders: Array<{
    id: string;
    title: string;
    status: string;
    dueAt: string;
    category: string;
    hrefHint: string;
  }>;
};
