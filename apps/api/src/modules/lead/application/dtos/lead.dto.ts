import type { LeadRecord } from '../../domain/repositories/lead.repository';

export type LeadDto = {
  id: string;
  tenantId: string;
  customerId: string | null;
  assignedToId: string | null;
  source: LeadRecord['source'];
  sourceDetail: string | null;
  stage: LeadRecord['stage'];
  lostReason: string | null;
  eventType: string | null;
  eventStartDate: Date | null;
  eventEndDate: Date | null;
  venue: string | null;
  estimatedBudgetAmount: number | null;
  estimatedBudgetCurrency: string;
  guestCount: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toLeadDto(lead: LeadRecord): LeadDto {
  return { ...lead };
}
