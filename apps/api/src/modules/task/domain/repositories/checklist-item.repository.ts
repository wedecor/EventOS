export type ChecklistItemRecord = {
  id: string;
  tenantId: string;
  taskId: string;
  description: string;
  isCompleted: boolean;
  completedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateChecklistItemData = {
  taskId: string;
  description: string;
  sortOrder?: number;
};

export type UpdateChecklistItemData = {
  description?: string;
  isCompleted?: boolean;
  completedAt?: Date | null;
  sortOrder?: number;
};

export abstract class ChecklistItemRepository {
  abstract create(
    tenantId: string,
    data: CreateChecklistItemData,
  ): Promise<ChecklistItemRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<ChecklistItemRecord | null>;

  abstract findByTaskId(
    tenantId: string,
    taskId: string,
  ): Promise<ChecklistItemRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateChecklistItemData,
    version: number,
  ): Promise<ChecklistItemRecord>;

  abstract remove(tenantId: string, id: string): Promise<void>;
}
