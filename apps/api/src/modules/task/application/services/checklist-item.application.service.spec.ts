import { ConcurrentModificationError } from '../../../../shared/database';
import { ChecklistItemApplicationService } from './checklist-item.application.service';
import type {
  ChecklistItemRecord,
  ChecklistItemRepository,
} from '../../domain/repositories/checklist-item.repository';
import type {
  TaskRecord,
  TaskRepository,
} from '../../domain/repositories/task.repository';

describe('ChecklistItemApplicationService', () => {
  const tenantId = 'tenant-1';
  const taskId = 'task-1';
  const itemId = 'item-1';

  const baseTask: TaskRecord = {
    id: taskId,
    tenantId,
    bookingId: 'booking-1',
    title: 'Pack materials',
    description: null,
    assignedTo: null,
    dueAt: null,
    status: 'pending',
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseItem: ChecklistItemRecord = {
    id: itemId,
    tenantId,
    taskId,
    description: 'Pack backdrop frame',
    isCompleted: false,
    completedAt: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let taskRepository: jest.Mocked<TaskRepository>;
  let checklistItemRepository: jest.Mocked<ChecklistItemRepository>;
  let service: ChecklistItemApplicationService;

  beforeEach(() => {
    taskRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      update: jest.fn(),
    };
    checklistItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTaskId: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    service = new ChecklistItemApplicationService(
      taskRepository,
      checklistItemRepository,
    );
  });

  // ── addChecklistItem ─────────────────────────────────────────────────

  it('addChecklistItem rejects when task not found', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.addChecklistItem(tenantId, taskId, {
      description: 'Pack backdrop frame',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('addChecklistItem rejects when task is completed', async () => {
    taskRepository.findById.mockResolvedValue({
      ...baseTask,
      status: 'completed',
    });

    const result = await service.addChecklistItem(tenantId, taskId, {
      description: 'Pack backdrop frame',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('addChecklistItem rejects blank description', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);

    const result = await service.addChecklistItem(tenantId, taskId, {
      description: '   ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('addChecklistItem creates item on an open task', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.create.mockResolvedValue(baseItem);

    const result = await service.addChecklistItem(tenantId, taskId, {
      description: 'Pack backdrop frame',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(itemId);
      expect(result.value.isCompleted).toBe(false);
    }
    expect(checklistItemRepository.create).toHaveBeenCalledWith(tenantId, {
      description: 'Pack backdrop frame',
      taskId,
    });
  });

  // ── updateChecklistItem ──────────────────────────────────────────────

  it('updateChecklistItem rejects when task not found', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      { isCompleted: true },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateChecklistItem rejects when item not found', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findById.mockResolvedValue(null);

    const result = await service.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      { isCompleted: true },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateChecklistItem rejects when item belongs to a different task', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findById.mockResolvedValue({
      ...baseItem,
      taskId: 'other-task',
    });

    const result = await service.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      { isCompleted: true },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateChecklistItem handles ConcurrentModificationError', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findById.mockResolvedValue(baseItem);
    checklistItemRepository.update.mockRejectedValue(
      new ConcurrentModificationError('ChecklistItem', itemId),
    );

    const result = await service.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      { isCompleted: true },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('updateChecklistItem marks item completed and sets completedAt', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findById.mockResolvedValue(baseItem);
    checklistItemRepository.update.mockResolvedValue({
      ...baseItem,
      isCompleted: true,
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      { isCompleted: true },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.isCompleted).toBe(true);
      expect(result.value.completedAt).not.toBeNull();
    }
    expect(checklistItemRepository.update).toHaveBeenCalledWith(
      tenantId,
      itemId,
      {
        description: undefined,
        isCompleted: true,
        completedAt: expect.any(Date),
        sortOrder: undefined,
      },
      1,
    );
  });

  // ── removeChecklistItem ──────────────────────────────────────────────

  it('removeChecklistItem rejects when task not found', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.removeChecklistItem(tenantId, taskId, itemId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('removeChecklistItem removes and returns success', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findById.mockResolvedValue(baseItem);
    checklistItemRepository.remove.mockResolvedValue(undefined);

    const result = await service.removeChecklistItem(tenantId, taskId, itemId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.itemId).toBe(itemId);
      expect(result.value.deleted).toBe(true);
    }
    expect(checklistItemRepository.remove).toHaveBeenCalledWith(
      tenantId,
      itemId,
    );
  });

  // ── listChecklistItems ───────────────────────────────────────────────

  it('listChecklistItems returns empty array when none exist', async () => {
    checklistItemRepository.findByTaskId.mockResolvedValue([]);

    const result = await service.listChecklistItems(tenantId, taskId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('listChecklistItems returns mapped DTOs', async () => {
    checklistItemRepository.findByTaskId.mockResolvedValue([baseItem]);

    const result = await service.listChecklistItems(tenantId, taskId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe(itemId);
    }
  });
});
