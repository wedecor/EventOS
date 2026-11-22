import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '../api/staff.api';
import type {
  CreateStaffRequest,
  ListStaffQuery,
  UpdateStaffRequest,
} from '../schemas/staff.schemas';

export const staffKeys = {
  all: ['staff'] as const,
  list: (query: ListStaffQuery) =>
    [...staffKeys.all, 'list', query.status ?? ''] as const,
  detail: (id: string) => [...staffKeys.all, 'detail', id] as const,
};

export function useStaffListQuery(query: ListStaffQuery = {}) {
  return useQuery({
    queryKey: staffKeys.list(query),
    queryFn: () => staffApi.list(query),
    staleTime: 30_000,
  });
}

export function useStaffMemberQuery(id: string | null | undefined) {
  return useQuery({
    queryKey: staffKeys.detail(id ?? ''),
    queryFn: () => staffApi.getById(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useCreateStaffMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateStaffRequest) => staffApi.create(body),
    onSuccess: (member) => {
      queryClient.setQueryData(staffKeys.detail(member.id), member);
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}

export function useUpdateStaffMutation(staffId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      body,
      version,
    }: {
      body: UpdateStaffRequest;
      version: number;
    }) => staffApi.update(staffId, body, version),
    onSuccess: (member) => {
      queryClient.setQueryData(staffKeys.detail(member.id), member);
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
  });
}
