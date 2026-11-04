import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads.api';
import type {
  AssignLeadRequest,
  ChangeLeadStageRequest,
  CreateFollowUpRequest,
  CreateLeadRequest,
} from '../schemas/lead.schemas';

export const leadKeys = {
  all: ['leads'] as const,
  list: () => [...leadKeys.all, 'list'] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
};

export function useLeadsQuery() {
  return useQuery({
    queryKey: leadKeys.list(),
    queryFn: () => leadsApi.list(),
    staleTime: 30_000,
  });
}

export function useLeadQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? ''),
    queryFn: () => leadsApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateLeadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateLeadRequest) => leadsApi.create(body),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: leadKeys.list() });
    },
  });
}

export function useChangeLeadStageMutation(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: ChangeLeadStageRequest;
      version: number;
    }) => leadsApi.changeStage(leadId, body, version),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: leadKeys.list() });
    },
  });
}

export function useAssignLeadMutation(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: AssignLeadRequest;
      version: number;
    }) => leadsApi.assign(leadId, body, version),
    onSuccess: (lead) => {
      queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      void queryClient.invalidateQueries({ queryKey: leadKeys.list() });
    },
  });
}

export function useScheduleFollowUpMutation(leadId: string) {
  return useMutation({
    mutationFn: (body: CreateFollowUpRequest) =>
      leadsApi.scheduleFollowUp(leadId, body),
  });
}
