import type { TaskStatus } from '@prisma/client';

export type TaskRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  title: string;
  description: string | null;
  assignedTo: string | null;
  dueAt: Date | null;
  status: TaskStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateTaskData = {
  bookingId: string;
  title: string;
  description?: string | null;
  assignedTo?: string | null;
  dueAt?: Date | null;
};

export type UpdateTaskData = {
  title?: string;
  description?: string | null;
  assignedTo?: string | null;
  dueAt?: Date | null;
  status?: TaskStatus;
  completedAt?: Date | null;
};

export abstract class TaskRepository {
  abstract create(tenantId: string, data: CreateTaskData): Promise<TaskRecord>;

  abstract findById(tenantId: string, id: string): Promise<TaskRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<TaskRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateTaskData,
    version: number,
  ): Promise<TaskRecord>;
}
