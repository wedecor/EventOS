import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
};

export function useMe() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest<AuthUser>('/auth/me'),
    staleTime: 5 * 60_000,
  });
}
