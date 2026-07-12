import { Injectable } from '@nestjs/common';
import type { Task } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateTaskData,
  TaskRecord,
  TaskRepository,
  UpdateTaskData,
} from '../../domain/repositories/task.repository';

@Injectable()
export class TaskRepositoryImpl
  extends TenantScopedRepository
  implements TaskRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(tenantId: string, data: CreateTaskData): Promise<TaskRecord> {
    const task = await this.prisma.task.create({
      data: {
        tenant: { connect: { id: tenantId } },
        booking: { connect: { id: data.bookingId } },
        title: data.title,
        description: data.description ?? null,
        assignedTo: data.assignedTo ?? null,
        dueAt: data.dueAt ?? null,
      },
    });

    return this.mapRecord(task);
  }

  async findById(tenantId: string, id: string): Promise<TaskRecord | null> {
    const task = await this.prisma.task.findFirst({
      where: { id, tenantId },
    });

    return task ? this.mapRecord(task) : null;
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<TaskRecord[]> {
    const tasks = await this.prisma.task.findMany({
      where: { tenantId, bookingId },
      orderBy: { createdAt: 'asc' },
    });

    return tasks.map((task) => this.mapRecord(task));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateTaskData,
    version: number,
  ): Promise<TaskRecord> {
    try {
      const task = await this.prisma.task.update({
        where: { id, tenantId, version },
        data: {
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo,
          dueAt: data.dueAt,
          status: data.status,
          completedAt: data.completedAt,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(task);
    } catch (error: unknown) {
      return this.toConcurrentModification('Task', id, error);
    }
  }

  private mapRecord(task: Task): TaskRecord {
    return {
      id: task.id,
      tenantId: task.tenantId,
      bookingId: task.bookingId,
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo,
      dueAt: task.dueAt,
      status: task.status,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      version: task.version,
    };
  }
}
