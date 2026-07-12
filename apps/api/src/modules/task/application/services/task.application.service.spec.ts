import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  TaskCompletedEvent,
  TaskCreatedEvent,
  TaskUpdatedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { TaskApplicationService } from './task.application.service';
import type {
  ChecklistItemRecord,
  ChecklistItemRepository,
} from '../../domain/repositories/checklist-item.repository';
import type {
  TaskRecord,
  TaskRepository,
} from '../../domain/repositories/task.repository';
import type {
  EventRecord,
  EventRepository,
} from '../../../booking/domain/repositories/event.repository';

describe('TaskApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const taskId = 'task-1';

  const baseBooking: EventRecord = {
    id: bookingId,
    tenantId,
    customerId: 'customer-1',
    leadId: 'lead-1',
    quotationId: 'quotation-1',
    bookingNumber: 5001,
    status: 'in_preparation',
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venueName: 'Bangalore',
    guestCount: 200,
    requirementsNotes: null,
    workspaceStatus: 'active',
    preparationStatus: 'pending',
    operationalMilestone: null,
    executionOwnerId: null,
    cancellationReason: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseTask: TaskRecord = {
    id: taskId,
    tenantId,
    bookingId,
    title: 'Confirm venue access',
    description: null,
    assignedTo: null,
    dueAt: null,
    status: 'pending',
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const baseChecklistItem: ChecklistItemRecord = {
    id: 'checklist-1',
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
  let eventRepository: jest.Mocked<EventRepository>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: TaskApplicationService;
  let publish: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
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
    eventRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByQuotationId: jest.fn(),
      findMaxBookingNumber: jest.fn(),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };
    eventPublisher = { publish };

    service = new TaskApplicationService(
      taskRepository,
      checklistItemRepository,
      eventRepository,
      eventPublisher,
    );
  });

  // ── createTask ───────────────────────────────────────────────────────

  it('createTask rejects blank title', async () => {
    const result = await service.createTask(tenantId, {
      bookingId,
      title: '   ',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('createTask rejects when booking not found', async () => {
    eventRepository.findById.mockResolvedValue(null);

    const result = await service.createTask(tenantId, {
      bookingId,
      title: 'Confirm venue access',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('createTask rejects when booking is cancelled', async () => {
    eventRepository.findById.mockResolvedValue({
      ...baseBooking,
      status: 'cancelled',
    });

    const result = await service.createTask(tenantId, {
      bookingId,
      title: 'Confirm venue access',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('createTask creates task and publishes TaskCreated event', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    taskRepository.create.mockResolvedValue(baseTask);

    const result = await service.createTask(tenantId, {
      bookingId,
      title: 'Confirm venue access',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe(taskId);
      expect(result.value.status).toBe('pending');
      expect(result.value.checklistItems).toEqual([]);
    }
    expect(publish).toHaveBeenCalledWith(expect.any(TaskCreatedEvent));
  });

  it('createTask passes all fields to repository', async () => {
    eventRepository.findById.mockResolvedValue(baseBooking);
    taskRepository.create.mockResolvedValue(baseTask);

    const dueAt = new Date('2026-08-01T09:00:00.000Z');
    await service.createTask(tenantId, {
      bookingId,
      title: 'Confirm venue access',
      description: 'Call venue manager',
      assignedTo: 'staff-1',
      dueAt,
    });

    expect(taskRepository.create).toHaveBeenCalledWith(tenantId, {
      bookingId,
      title: 'Confirm venue access',
      description: 'Call venue manager',
      assignedTo: 'staff-1',
      dueAt,
    });
  });

  // ── getTaskById ──────────────────────────────────────────────────────

  it('getTaskById returns NOT_FOUND when missing', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.getTaskById(tenantId, taskId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('getTaskById returns task with embedded checklist items', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    checklistItemRepository.findByTaskId.mockResolvedValue([baseChecklistItem]);

    const result = await service.getTaskById(tenantId, taskId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.checklistItems).toHaveLength(1);
      expect(result.value.checklistItems[0].id).toBe('checklist-1');
    }
  });

  // ── listTasksForBooking ──────────────────────────────────────────────

  it('listTasksForBooking returns empty array when no tasks exist', async () => {
    taskRepository.findByBookingId.mockResolvedValue([]);

    const result = await service.listTasksForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it('listTasksForBooking returns tasks with embedded checklist items', async () => {
    taskRepository.findByBookingId.mockResolvedValue([baseTask]);
    checklistItemRepository.findByTaskId.mockResolvedValue([baseChecklistItem]);

    const result = await service.listTasksForBooking(tenantId, bookingId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].checklistItems).toHaveLength(1);
    }
  });

  // ── updateTask ───────────────────────────────────────────────────────

  it('updateTask rejects when task not found', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.updateTask(
      tenantId,
      taskId,
      { title: 'Updated title' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateTask rejects when task is completed', async () => {
    taskRepository.findById.mockResolvedValue({
      ...baseTask,
      status: 'completed',
    });

    const result = await service.updateTask(
      tenantId,
      taskId,
      { title: 'Updated title' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('updateTask rejects blank title', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);

    const result = await service.updateTask(
      tenantId,
      taskId,
      { title: '   ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateTask handles ConcurrentModificationError', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    taskRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Task', taskId),
    );

    const result = await service.updateTask(
      tenantId,
      taskId,
      { title: 'Updated title' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('updateTask updates successfully and publishes TaskUpdated event', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    taskRepository.update.mockResolvedValue({
      ...baseTask,
      title: 'Updated title',
      version: 2,
    });

    const result = await service.updateTask(
      tenantId,
      taskId,
      { title: 'Updated title' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe('Updated title');
      expect(result.value.version).toBe(2);
    }
    expect(publish).toHaveBeenCalledWith(expect.any(TaskUpdatedEvent));
  });

  // ── updateTaskStatus ─────────────────────────────────────────────────

  it('updateTaskStatus rejects when task not found', async () => {
    taskRepository.findById.mockResolvedValue(null);

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'in_progress' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('updateTaskStatus rejects invalid transition', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'completed' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
    expect(taskRepository.update).not.toHaveBeenCalled();
  });

  it('updateTaskStatus rejects transition from terminal state', async () => {
    taskRepository.findById.mockResolvedValue({
      ...baseTask,
      status: 'cancelled',
    });

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'in_progress' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('updateTaskStatus allows pending -> in_progress and publishes TaskUpdated', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    taskRepository.update.mockResolvedValue({
      ...baseTask,
      status: 'in_progress',
      version: 2,
    });

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'in_progress' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('in_progress');
    }
    expect(taskRepository.update).toHaveBeenCalledWith(
      tenantId,
      taskId,
      { status: 'in_progress', completedAt: null },
      1,
    );
    expect(publish).toHaveBeenCalledWith(expect.any(TaskUpdatedEvent));
  });

  it('updateTaskStatus allows in_progress -> completed and publishes TaskCompleted', async () => {
    const inProgressTask: TaskRecord = { ...baseTask, status: 'in_progress' };
    taskRepository.findById.mockResolvedValue(inProgressTask);
    taskRepository.update.mockResolvedValue({
      ...inProgressTask,
      status: 'completed',
      completedAt: new Date(),
      version: 2,
    });

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'completed' },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('completed');
      expect(result.value.completedAt).not.toBeNull();
    }
    expect(publish).toHaveBeenCalledWith(expect.any(TaskCompletedEvent));
  });

  it('updateTaskStatus handles ConcurrentModificationError', async () => {
    taskRepository.findById.mockResolvedValue(baseTask);
    taskRepository.update.mockRejectedValue(
      new ConcurrentModificationError('Task', taskId),
    );

    const result = await service.updateTaskStatus(
      tenantId,
      taskId,
      { status: 'in_progress' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
