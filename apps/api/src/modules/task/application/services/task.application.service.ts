import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  TaskCompletedEvent,
  TaskCreatedEvent,
  TaskUpdatedEvent,
} from '../../../../shared/events/sprint2-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ChecklistItemRepository } from '../../domain/repositories/checklist-item.repository';
import {
  TaskRepository,
  type TaskRecord,
} from '../../domain/repositories/task.repository';
import { toTaskDto, type TaskDto } from '../dtos/task.dto';

export type CreateTaskInput = {
  bookingId: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  dueAt?: Date | null;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string | null;
  assignedTo?: string | null;
  dueAt?: Date | null;
};

export type UpdateTaskStatusInput = {
  status: TaskRecord['status'];
};

const ALLOWED_TRANSITIONS: Record<
  TaskRecord['status'],
  TaskRecord['status'][]
> = {
  pending: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

@Injectable()
export class TaskApplicationService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly checklistItemRepository: ChecklistItemRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // EP1-OPS-003 — Create an execution task/checklist entry for a booking
  async createTask(
    tenantId: string,
    input: CreateTaskInput,
  ): Promise<Result<TaskDto>> {
    if (input.title.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Task title is required.');
    }

    const booking = await this.eventRepository.findById(
      tenantId,
      input.bookingId,
    );
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot create a task for a cancelled booking.',
        { bookingId: input.bookingId, status: booking.status },
      );
    }

    const task = await this.taskRepository.create(tenantId, {
      bookingId: input.bookingId,
      title: input.title,
      description: input.description,
      assignedTo: input.assignedTo,
      dueAt: input.dueAt,
    });

    this.eventPublisher.publish(new TaskCreatedEvent(tenantId, task));

    return success(toTaskDto(task));
  }

  async getTaskById(
    tenantId: string,
    taskId: string,
  ): Promise<Result<TaskDto>> {
    const task = await this.taskRepository.findById(tenantId, taskId);
    if (!task) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    const checklistItems = await this.checklistItemRepository.findByTaskId(
      tenantId,
      taskId,
    );

    return success(toTaskDto(task, checklistItems));
  }

  // EP1-OPS-003, EP1-OPS-004 — Task and checklist visibility for a booking
  async listTasksForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<TaskDto[]>> {
    const tasks = await this.taskRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    const dtos = await Promise.all(
      tasks.map(async (task) => {
        const checklistItems = await this.checklistItemRepository.findByTaskId(
          tenantId,
          task.id,
        );
        return toTaskDto(task, checklistItems);
      }),
    );

    return success(dtos);
  }

  async updateTask(
    tenantId: string,
    taskId: string,
    input: UpdateTaskInput,
    version: number,
  ): Promise<Result<TaskDto>> {
    const existing = await this.taskRepository.findById(tenantId, taskId);
    if (!existing) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    if (existing.status === 'completed' || existing.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        `Cannot update a task in status '${existing.status}'.`,
        { taskId, status: existing.status },
      );
    }

    if (input.title !== undefined && input.title.trim().length === 0) {
      return failure('VALIDATION_ERROR', 'Task title is required.');
    }

    try {
      const task = await this.taskRepository.update(
        tenantId,
        taskId,
        {
          title: input.title,
          description: input.description,
          assignedTo: input.assignedTo,
          dueAt: input.dueAt,
        },
        version,
      );

      this.eventPublisher.publish(new TaskUpdatedEvent(tenantId, task));

      return success(toTaskDto(task));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Task was modified by another request. Reload and retry.',
          { taskId },
        );
      }
      throw error;
    }
  }

  // EP1-OPS-003, EP1-OPS-004 — Advance/close out a task via its status
  async updateTaskStatus(
    tenantId: string,
    taskId: string,
    input: UpdateTaskStatusInput,
    version: number,
  ): Promise<Result<TaskDto>> {
    const existing = await this.taskRepository.findById(tenantId, taskId);
    if (!existing) {
      return failure('NOT_FOUND', 'Task not found.');
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status];
    if (!allowed.includes(input.status)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition task from '${existing.status}' to '${input.status}'.`,
        { taskId, from: existing.status, to: input.status },
      );
    }

    try {
      const task = await this.taskRepository.update(
        tenantId,
        taskId,
        {
          status: input.status,
          completedAt: input.status === 'completed' ? new Date() : null,
        },
        version,
      );

      if (task.status === 'completed') {
        this.eventPublisher.publish(new TaskCompletedEvent(tenantId, task));
      } else {
        this.eventPublisher.publish(new TaskUpdatedEvent(tenantId, task));
      }

      return success(toTaskDto(task));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Task was modified by another request. Reload and retry.',
          { taskId },
        );
      }
      throw error;
    }
  }
}
