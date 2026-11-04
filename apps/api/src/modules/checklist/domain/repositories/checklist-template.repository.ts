import type { ChecklistTemplateStatus, TaskCategory } from '@prisma/client';

export type ChecklistTemplateRecord = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  eventTypes: string[];
  category: TaskCategory;
  status: ChecklistTemplateStatus;
  templateVersion: number;
  sortOrder: number;
  rootTemplateId: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateChecklistTemplateData = {
  name: string;
  description?: string | null;
  eventTypes?: string[];
  category?: TaskCategory;
  status?: ChecklistTemplateStatus;
  templateVersion?: number;
  sortOrder?: number;
  rootTemplateId?: string;
};

export type UpdateChecklistTemplateData = {
  name?: string;
  description?: string | null;
  eventTypes?: string[];
  category?: TaskCategory;
  status?: ChecklistTemplateStatus;
  templateVersion?: number;
  sortOrder?: number;
};

export abstract class ChecklistTemplateRepository {
  abstract create(
    tenantId: string,
    data: CreateChecklistTemplateData,
  ): Promise<ChecklistTemplateRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistTemplateRecord | null>;

  abstract findMany(
    tenantId: string,
    filters?: { status?: ChecklistTemplateStatus; rootTemplateId?: string },
  ): Promise<ChecklistTemplateRecord[]>;

  abstract findActiveMatchingEventType(
    tenantId: string,
    eventType: string | null,
  ): Promise<ChecklistTemplateRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateChecklistTemplateData,
    version: number,
  ): Promise<ChecklistTemplateRecord>;

  abstract countGeneratedForTemplate(
    tenantId: string,
    templateId: string,
  ): Promise<number>;
}
