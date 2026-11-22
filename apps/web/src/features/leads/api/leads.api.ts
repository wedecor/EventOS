import { apiClient } from '@/shared/api/client';
import {
  parseLeadIntelligence,
  type LeadIntelligenceResponse,
} from '../schemas/lead-intelligence.schemas';
import {
  parseFollowUp,
  parseFollowUpList,
  parseLead,
  parseLeadList,
  type AssignLeadRequest,
  type ChangeLeadStageRequest,
  type CreateFollowUpRequest,
  type CreateLeadRequest,
  type FollowUp,
  type Lead,
  type UpdateFollowUpRequest,
} from '../schemas/lead.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/** Lead endpoints from frozen OpenAPI (+ M4-AI Lead Intelligence). */
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

  async listFollowUps(leadId: string): Promise<FollowUp[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/leads/${leadId}/follow-ups`,
    );
    return parseFollowUpList(data);
  },

  async updateFollowUp(
    followUpId: string,
    body: UpdateFollowUpRequest,
    version: number,
  ): Promise<FollowUp> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/follow-ups/${followUpId}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseFollowUp(data);
  },

  /** Read-only AI analysis — never writes lead fields. */
  async generateIntelligence(id: string): Promise<LeadIntelligenceResponse> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/leads/${id}/ai/intelligence`,
      {},
    );
    return parseLeadIntelligence(data);
  },
};
