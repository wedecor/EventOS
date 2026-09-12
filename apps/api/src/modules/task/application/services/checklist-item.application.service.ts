import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import {
  ChecklistItemRepository,
  type CreateChecklistItemData,
} from '../../domain/repositories/checklist-item.repository';
import { TaskRepository } from '../../domain/repositories/task.repository';
import {
  toChecklistItemDto,
  type ChecklistItemDto,
} from '../dtos/checklist-item.dto';

export type AddChecklistItemInput = Omit<CreateChecklistItemData, 'taskId'>;

export type UpdateChecklistItemInput = {
  description?: string;
  isCompleted?: boolean;
  sortOrder?: number;
};

@Injectable()
export class ChecklistItemApplicationService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly checklistItemRepository: ChecklistItemRepository,
  ) {}

  // EP1-OPS-003 — Add a checklist row to a task
  async addChecklistItem(
    tenantId: string,
    taskId: string,
    input: AddChecklistItemInput,
  ): Promise<Result<ChecklistItemDto>> {
    const task = await this.taskRepository.findById(tenantId, taskId);
    if (!task) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    if (task.status === 'completed' || task.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        `Cannot add checklist items to a task in status '${task.status}'.`,
        { taskId, status: task.status },
      );
    }

    if (input.description.trim().length === 0) {
      return failure(
        'VALIDATION_ERROR',
        'Checklist item description is required.',
      );
    }

    const item = await this.checklistItemRepository.create(tenantId, {
      ...input,
      taskId,
    });

    return success(toChecklistItemDto(item));
  }

  async updateChecklistItem(
    tenantId: string,
    taskId: string,
    itemId: string,
    input: UpdateChecklistItemInput,
    version: number,
  ): Promise<Result<ChecklistItemDto>> {
    const task = await this.taskRepository.findById(tenantId, taskId);
    if (!task) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    const existing = await this.checklistItemRepository.findById(
      tenantId,
      itemId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Checklist item not found.');
    }

    if (existing.taskId !== taskId) {
      return failure(
        'NOT_FOUND',
        'Checklist item does not belong to this task.',
      );
    }

    if (
      input.description !== undefined &&
      input.description.trim().length === 0
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Checklist item description is required.',
      );
    }

    try {
      const updated = await this.checklistItemRepository.update(
        tenantId,
        itemId,
        {
          description: input.description,
          isCompleted: input.isCompleted,
          completedAt:
            input.isCompleted === undefined
              ? undefined
              : input.isCompleted
                ? new Date()
                : null,
          sortOrder: input.sortOrder,
        },
        version,
      );

      return success(toChecklistItemDto(updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Checklist item was modified by another request. Reload and retry.',
          { itemId },
        );
      }
      throw error;
    }
  }

  async removeChecklistItem(
    tenantId: string,
    taskId: string,
    itemId: string,
  ): Promise<Result<{ itemId: string; deleted: boolean }>> {
    const task = await this.taskRepository.findById(tenantId, taskId);
    if (!task) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    const existing = await this.checklistItemRepository.findById(
      tenantId,
      itemId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Checklist item not found.');
    }

    if (existing.taskId !== taskId) {
      return failure(
        'NOT_FOUND',
        'Checklist item does not belong to this task.',
      );
    }

    await this.checklistItemRepository.remove(tenantId, itemId);

    return success({ itemId, deleted: true });
  }

  async listChecklistItems(
    tenantId: string,
    taskId: string,
  ): Promise<Result<ChecklistItemDto[]>> {
    const items = await this.checklistItemRepository.findByTaskId(
      tenantId,
      taskId,
    );

    return success(items.map(toChecklistItemDto));
  }
}
