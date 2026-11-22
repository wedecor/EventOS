export type FollowUp = {
  id: string;
  leadId: string;
  dueAt: string;
  notes: string | null;
  status: string;
  version: number;
};

export type Lead = {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerDisplayName?: string | null;
  assignedToId: string | null;
  source: string;
  sourceDetail: string | null;
  stage: string;
  lostReason: string | null;
  eventType: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
  venue: string | null;
  estimatedBudgetAmount: number | null;
  estimatedBudgetCurrency: string;
  guestCount: number | null;
  notes: string | null;
  version: number;
};

export type Customer = {
  id: string;
  displayName: string;
  type: string;
  status: string;
  primaryPhone: string | null;
  primaryEmail: string | null;
  notes: string | null;
  version: number;
};

export type QuotationLineItem = {
  id: string;
  quotationId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  version: number;
};

export type Quotation = {
  id: string;
  customerId: string;
  leadId: string | null;
  quotationNumber: number;
  revisionNumber: number;
  status: string;
  eventType: string | null;
  venue: string | null;
  validUntil: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  version: number;
};

export type Booking = {
  id: string;
  customerId: string;
  leadId: string | null;
  quotationId: string;
  bookingNumber: number;
  status: string;
  preparationStatus: string;
  eventType: string | null;
  venueName: string | null;
  version: number;
};
