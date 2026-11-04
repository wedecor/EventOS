import { apiClient } from '@/shared/api/client';
import {
  parseFollowUp,
  parseLead,
  parseLeadList,
  type AssignLeadRequest,
  type ChangeLeadStageRequest,
  type CreateFollowUpRequest,
  type CreateLeadRequest,
  type FollowUp,
  type Lead,
} from '../schemas/lead.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/** Lead endpoints from frozen OpenAPI. No general PATCH /leads/:id. */
export const leadsApi = {
  async list(): Promise<Lead[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/leads');
    return parseLeadList(data);
  },

  async getById(id: string): Promise<Lead> {
    const { data } = await apiClient.get<unknown>(`/api/v1/leads/${id}`);
    return parseLead(data);
  },

  async create(body: CreateLeadRequest): Promise<Lead> {
    const { data } = await apiClient.post<unknown>('/api/v1/leads', body);
    return parseLead(data);
  },

  async changeStage(
    id: string,
    body: ChangeLeadStageRequest,
    version: number,
  ): Promise<Lead> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/leads/${id}/stage`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseLead(data);
  },

  async assign(id: string, body: AssignLeadRequest, version: number): Promise<Lead> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/leads/${id}/assign`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseLead(data);
  },

  async scheduleFollowUp(
    id: string,
    body: CreateFollowUpRequest,
  ): Promise<FollowUp> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/leads/${id}/follow-ups`,
      body,
    );
    return parseFollowUp(data);
  },
};
