import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../shared/api/client';
import { useMe } from '../../shared/auth/useMe';
import { useToast } from '../../shared/ui/Toast';
import {
  bookingPathForSuggestion,
  suggestionTypeLabel,
} from './suggestionLabels';

type SuggestionRow = {
  id: string;
  type: string;
  status: string;
  aggregateType: string;
  aggregateId: string;
  version: number;
};

export function SuggestionsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const meQuery = useMe();

  const { data, isLoading, error } = useQuery({
    queryKey: ['suggestions', 'pending'],
    queryFn: () => apiRequest<SuggestionRow[]>('/suggestions?status=pending'),
  });

  const accept = useMutation({
    mutationFn: ({
      id,
      assigneeId,
    }: {
      id: string;
      assigneeId?: string;
    }) =>
      apiRequest<SuggestionRow>(`/suggestions/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify(assigneeId ? { assigneeId } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.push('Suggestion accepted');
    },
  });

  const dismiss = useMutation({
    mutationFn: (id: string) =>
      apiRequest<SuggestionRow>(`/suggestions/${id}/dismiss`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      toast.push('Suggestion dismissed');
    },
  });

  function handleAccept(item: SuggestionRow) {
    if (item.type === 'staff.assign') {
      const defaultId = meQuery.data?.id;
      const assigneeId = window.prompt(
        'Assignee user UUID',
        defaultId ?? '',
      );
      if (!assigneeId?.trim()) {
        return;
      }
      accept.mutate({ id: item.id, assigneeId: assigneeId.trim() });
      return;
    }
    accept.mutate({ id: item.id });
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Suggestions</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pending human confirmations (ADR-017)
      </p>

      {isLoading ? <p className="mt-6 text-slate-600">Loading…</p> : null}
      {error ? (
        <p className="mt-6 text-red-600" role="alert">
          Could not load suggestions.
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No pending suggestions.
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {data?.map((item) => {
          const bookingPath = bookingPathForSuggestion(
            item.aggregateType,
            item.aggregateId,
          );

          return (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {suggestionTypeLabel(item.type)}
                </p>
                <p className="text-xs text-slate-500">
                  {item.aggregateType} · {item.aggregateId.slice(0, 8)}…
                  {bookingPath ? (
                    <>
                      {' '}
                      ·{' '}
                      <Link
                        to={bookingPath}
                        className="text-brand-700 hover:underline"
                      >
                        Open booking
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md bg-brand-700 px-3 py-1.5 text-sm text-white hover:bg-brand-600 disabled:opacity-50"
                  disabled={accept.isPending}
                  onClick={() => handleAccept(item)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                  disabled={dismiss.isPending}
                  onClick={() => dismiss.mutate(item.id)}
                >
                  Dismiss
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
