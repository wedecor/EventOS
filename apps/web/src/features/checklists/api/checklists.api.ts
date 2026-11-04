import { apiClient } from '@/shared/api/client';
import {
  parseChecklistTemplate,
  parseChecklistTemplateItem,
  parseChecklistTemplateList,
  parseEventChecklistItem,
  parseEventChecklistList,
  type ChecklistTemplate,
  type ChecklistTemplateItem,
  type ChecklistTemplateStatus,
  type CreateChecklistTemplateItemRequest,
  type CreateChecklistTemplateRequest,
  type EventChecklist,
  type EventChecklistItem,
  type GenerateEventChecklistsRequest,
  type UpdateChecklistTemplateRequest,
  type UpdateEventChecklistItemRequest,
} from '../schemas/checklist.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

export const checklistTemplatesApi = {
  async list(status?: ChecklistTemplateStatus): Promise<ChecklistTemplate[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/checklist-templates', {
      params: status ? { status } : undefined,
    });
    return parseChecklistTemplateList(data);
  },

  async getById(id: string): Promise<ChecklistTemplate> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/checklist-templates/${id}`,
    );
    return parseChecklistTemplate(data);
  },

  async listVersions(id: string): Promise<ChecklistTemplate[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/checklist-templates/${id}/versions`,
    );
    return parseChecklistTemplateList(data);
  },

  async create(
    body: CreateChecklistTemplateRequest,
  ): Promise<ChecklistTemplate> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/checklist-templates',
      body,
    );
    return parseChecklistTemplate(data);
  },

  async update(
    id: string,
    body: UpdateChecklistTemplateRequest,
    version: number,
  ): Promise<ChecklistTemplate> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/checklist-templates/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseChecklistTemplate(data);
  },

  async archive(id: string, version: number): Promise<ChecklistTemplate> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/checklist-templates/${id}/archive`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseChecklistTemplate(data);
  },

  async duplicate(id: string): Promise<ChecklistTemplate> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/checklist-templates/${id}/duplicate`,
    );
    return parseChecklistTemplate(data);
  },

  async addItem(
    templateId: string,
    body: CreateChecklistTemplateItemRequest,
  ): Promise<ChecklistTemplateItem> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/checklist-templates/${templateId}/items`,
      body,
    );
    return parseChecklistTemplateItem(data);
  },
};

export const eventChecklistsApi = {
  async listByBooking(bookingId: string): Promise<EventChecklist[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/event-checklists', {
      params: { bookingId },
    });
    return parseEventChecklistList(data);
  },

  async generate(
    body: GenerateEventChecklistsRequest,
  ): Promise<EventChecklist[]> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/event-checklists/generate',
      body,
    );
    return parseEventChecklistList(data);
  },

  async updateItem(
    checklistId: string,
    itemId: string,
    body: UpdateEventChecklistItemRequest,
    version: number,
  ): Promise<EventChecklistItem> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/event-checklists/${checklistId}/items/${itemId}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseEventChecklistItem(data);
  },
};
