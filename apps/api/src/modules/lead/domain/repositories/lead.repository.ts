import type { LeadSource, LeadStage } from '@prisma/client';

export type LeadRecord = {
  id: string;
  tenantId: string;
  customerId: string | null;
  assignedToId: string | null;
  source: LeadSource;
  sourceDetail: string | null;
  stage: LeadStage;
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

export type CreateLeadData = {
  customerId?: string | null;
  assignedToId?: string | null;
  source: LeadSource;
  sourceDetail?: string | null;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venue?: string | null;
  estimatedBudgetAmount?: number | null;
  estimatedBudgetCurrency?: string;
  guestCount?: number | null;
  notes?: string | null;
};

export type UpdateLeadData = {
  customerId?: string | null;
  assignedToId?: string | null;
  sourceDetail?: string | null;
  eventType?: string | null;
  eventStartDate?: Date | null;
  eventEndDate?: Date | null;
  venue?: string | null;
  estimatedBudgetAmount?: number | null;
  estimatedBudgetCurrency?: string;
  guestCount?: number | null;
  notes?: string | null;
};

export type ChangeLeadStageData = {
  stage: LeadStage;
  lostReason?: string | null;
  changedById?: string | null;
  reason?: string | null;
};

export abstract class LeadRepository {
  abstract create(tenantId: string, data: CreateLeadData): Promise<LeadRecord>;

  abstract findById(tenantId: string, id: string): Promise<LeadRecord | null>;

  abstract findByPhone(tenantId: string, phone: string): Promise<LeadRecord[]>;

  abstract findByStage(
    tenantId: string,
    stage: LeadStage,
  ): Promise<LeadRecord[]>;

  abstract listAll(tenantId: string): Promise<LeadRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateLeadData,
    version: number,
  ): Promise<LeadRecord>;

  abstract changeStage(
    tenantId: string,
    id: string,
    data: ChangeLeadStageData,
    version: number,
  ): Promise<LeadRecord>;
}
