import type { QuotationStatus } from '@prisma/client';

export type QuotationRecord = {
  id: string;
  tenantId: string;
  customerId: string;
  leadId: string | null;
  quotationNumber: number;
  revisionNumber: number;
  status: QuotationStatus;
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venue: string | null;
  validUntil: Date | null;
  terms: string | null;
  notes: string | null;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  supersededById: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateQuotationData = {
  customerId: string;
  leadId?: string | null;
  quotationNumber: number;
  revisionNumber?: number;
  status?: QuotationStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venue?: string | null;
  validUntil?: Date | null;
  terms?: string | null;
  notes?: string | null;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
};

export type UpdateQuotationData = {
  leadId?: string | null;
  status?: QuotationStatus;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venue?: string | null;
  validUntil?: Date | null;
  terms?: string | null;
  notes?: string | null;
  subtotalAmount?: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  supersededById?: string | null;
};

export abstract class QuotationRepository {
  abstract create(
    tenantId: string,
    data: CreateQuotationData,
  ): Promise<QuotationRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<QuotationRecord | null>;

  abstract findLatestRevision(
    tenantId: string,
    quotationNumber: number,
  ): Promise<QuotationRecord | null>;

  abstract findLatestByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<QuotationRecord | null>;

  abstract findMaxQuotationNumber(tenantId: string): Promise<number>;

  // EP1-FIN-003 — Dashboard: batch quotation totals read for pending-payments aggregation
  abstract findByIds(
    tenantId: string,
    ids: string[],
  ): Promise<QuotationRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateQuotationData,
    version: number,
  ): Promise<QuotationRecord>;
}
