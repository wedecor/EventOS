import { apiClient } from '@/shared/api/client';
import {
  parseChecklistItem,
  parseTask,
  parseTaskList,
  type AddChecklistItemRequest,
  type ChecklistItem,
  type CreateTaskRequest,
  type Task,
  type UpdateChecklistItemRequest,
  type UpdateTaskRequest,
  type UpdateTaskStatusRequest,
} from '../schemas/task.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

export const tasksApi = {
  async listByBooking(bookingId: string): Promise<Task[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/tasks', {
      params: { bookingId },
    });
    return parseTaskList(data);
  },

  async getById(id: string): Promise<Task> {
    const { data } = await apiClient.get<unknown>(`/api/v1/tasks/${id}`);
    return parseTask(data);
  },

  async create(body: CreateTaskRequest): Promise<Task> {
    const { data } = await apiClient.post<unknown>('/api/v1/tasks', body);
    return parseTask(data);
  },

  async update(
    id: string,
    body: UpdateTaskRequest,
    version: number,
  ): Promise<Task> {
    const { data } = await apiClient.patch<unknown>(`/api/v1/tasks/${id}`, body, {
      headers: ifMatchHeader(version),
    });
    return parseTask(data);
  },

  async updateStatus(
    id: string,
    body: UpdateTaskStatusRequest,
    version: number,
  ): Promise<Task> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/tasks/${id}/status`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseTask(data);
  },

  async addChecklistItem(
    taskId: string,
    body: AddChecklistItemRequest,
  ): Promise<ChecklistItem> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/tasks/${taskId}/checklist-items`,
      body,
    );
    return parseChecklistItem(data);
  },

  async updateChecklistItem(
    taskId: string,
    itemId: string,
    body: UpdateChecklistItemRequest,
    version: number,
  ): Promise<ChecklistItem> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/tasks/${taskId}/checklist-items/${itemId}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseChecklistItem(data);
  },

  async removeChecklistItem(taskId: string, itemId: string): Promise<void> {
    await apiClient.delete(
      `/api/v1/tasks/${taskId}/checklist-items/${itemId}`,
    );
  },
};
