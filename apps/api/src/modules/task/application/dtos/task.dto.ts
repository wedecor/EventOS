import type { TaskRecord } from '../../domain/repositories/task.repository';
import {
  toChecklistItemDto,
  type ChecklistItemDto,
} from './checklist-item.dto';
import type { ChecklistItemRecord } from '../../domain/repositories/checklist-item.repository';

export type TaskDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueAt: Date | null;
  status: TaskRecord['status'];
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  checklistItems: ChecklistItemDto[];
};

export function toTaskDto(
  record: TaskRecord,
  checklistItems: ChecklistItemRecord[] = [],
): TaskDto {
  return { ...record, checklistItems: checklistItems.map(toChecklistItemDto) };
}
