import { apiClient } from '@/shared/api/client';
import {
  parseCommunicationAttachment,
  parseCommunicationAttachmentList,
  parseCommunicationRecord,
  parseCommunicationRecordList,
  parseCommunicationTemplate,
  parseCommunicationTemplateList,
  parseReminder,
  parseReminderList,
  type AddCommunicationAttachmentRequest,
  type CommunicationAttachment,
  type CommunicationRecord,
  type CommunicationTemplate,
  type CreateCommunicationRequest,
  type CreateCommunicationTemplateRequest,
  type CreateReminderRequest,
  type Reminder,
  type TransitionCommunicationRequest,
  type UpdateCommunicationRequest,
  type UpdateCommunicationTemplateRequest,
} from '../schemas/communication.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Communication Center — records, templates, reminders, attachment metadata.
 */
export const communicationsApi = {
  async listAll(): Promise<CommunicationRecord[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/communications');
    return parseCommunicationRecordList(data);
  },

  async listForBooking(bookingId: string): Promise<CommunicationRecord[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/communications`,
    );
    return parseCommunicationRecordList(data);
  },

  async getById(id: string): Promise<CommunicationRecord> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/communications/${id}`,
    );
    return parseCommunicationRecord(data);
  },

  async create(body: CreateCommunicationRequest): Promise<CommunicationRecord> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/communications',
      body,
    );
    return parseCommunicationRecord(data);
  },

  async update(
    id: string,
    body: UpdateCommunicationRequest,
    version: number,
  ): Promise<CommunicationRecord> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/communications/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseCommunicationRecord(data);
  },

  async transition(
    id: string,
    body: TransitionCommunicationRequest,
    version: number,
  ): Promise<CommunicationRecord> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/communications/${id}/transition`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseCommunicationRecord(data);
  },

  async softDelete(id: string, version: number): Promise<CommunicationRecord> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/communications/${id}/delete`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseCommunicationRecord(data);
  },

  async listAttachments(id: string): Promise<CommunicationAttachment[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/communications/${id}/attachments`,
    );
    return parseCommunicationAttachmentList(data);
  },

  async addAttachment(
    id: string,
    body: AddCommunicationAttachmentRequest,
  ): Promise<CommunicationAttachment> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/communications/${id}/attachments`,
      body,
    );
    return parseCommunicationAttachment(data);
  },

  async listTemplates(): Promise<CommunicationTemplate[]> {
    const { data } = await apiClient.get<unknown>(
      '/api/v1/communication-templates',
    );
    return parseCommunicationTemplateList(data);
  },

  async createTemplate(
    body: CreateCommunicationTemplateRequest,
  ): Promise<CommunicationTemplate> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/communication-templates',
      body,
    );
    return parseCommunicationTemplate(data);
  },

  async updateTemplate(
    id: string,
    body: UpdateCommunicationTemplateRequest,
    version: number,
  ): Promise<CommunicationTemplate> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/communication-templates/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseCommunicationTemplate(data);
  },

  async archiveTemplate(
    id: string,
    version: number,
  ): Promise<CommunicationTemplate> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/communication-templates/${id}/archive`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseCommunicationTemplate(data);
  },

  async listReminders(): Promise<Reminder[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/reminders');
    return parseReminderList(data);
  },

  async listRemindersForBooking(bookingId: string): Promise<Reminder[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/reminders`,
    );
    return parseReminderList(data);
  },

  async createReminder(body: CreateReminderRequest): Promise<Reminder> {
    const { data } = await apiClient.post<unknown>('/api/v1/reminders', body);
    return parseReminder(data);
  },

  async completeReminder(id: string, version: number): Promise<Reminder> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/reminders/${id}/complete`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseReminder(data);
  },

  async cancelReminder(id: string, version: number): Promise<Reminder> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/reminders/${id}/cancel`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseReminder(data);
  },
};
