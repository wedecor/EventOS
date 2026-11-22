export type ChecklistTemplateItemRecord = {
  id: string;
  tenantId: string;
  templateId: string;
  title: string;
  description: string | null;
  isRequired: boolean;
  defaultAssigneeRole: string | null;
  estimatedDurationMinutes: number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateChecklistTemplateItemData = {
  title: string;
  description?: string | null;
  isRequired?: boolean;
  defaultAssigneeRole?: string | null;
  estimatedDurationMinutes?: number | null;
  sortOrder?: number;
};

export type UpdateChecklistTemplateItemData = {
  title?: string;
  description?: string | null;
  isRequired?: boolean;
  defaultAssigneeRole?: string | null;
  estimatedDurationMinutes?: number | null;
  sortOrder?: number;
};

export abstract class ChecklistTemplateItemRepository {
  abstract create(
    tenantId: string,
    templateId: string,
    data: CreateChecklistTemplateItemData,
  ): Promise<ChecklistTemplateItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistTemplateItemRecord | null>;

  abstract findByTemplateId(
    tenantId: string,
    templateId: string,
  ): Promise<ChecklistTemplateItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateChecklistTemplateItemData,
    version: number,
  ): Promise<ChecklistTemplateItemRecord>;

  abstract remove(tenantId: string, id: string): Promise<void>;
}
