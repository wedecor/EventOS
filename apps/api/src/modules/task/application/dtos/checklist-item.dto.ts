import type { ChecklistItemRecord } from '../../domain/repositories/checklist-item.repository';

export type ChecklistItemDto = {
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

export function toChecklistItemDto(
  record: ChecklistItemRecord,
): ChecklistItemDto {
  return { ...record };
}
