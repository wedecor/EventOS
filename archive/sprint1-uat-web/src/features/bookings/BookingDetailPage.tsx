import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { ApiError, apiRequest } from '../../shared/api/client';
import { useMe } from '../../shared/auth/useMe';
import type { Booking } from '../../shared/types/domain';
import { StageBadge } from '../../shared/ui/StageBadge';
import { useToast } from '../../shared/ui/Toast';
import { suggestionTypeLabel } from '../suggestions/suggestionLabels';

type SuggestionRow = {
  id: string;
  type: string;
  status: string;
  aggregateType: string;
  aggregateId: string;
  version: number;
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const meQuery = useMe();

  const bookingQuery = useQuery({
    queryKey: ['bookings', id],
    queryFn: () => apiRequest<Booking>(`/bookings/${id}`),
    enabled: Boolean(id),
  });

  const suggestionsQuery = useQuery({
    queryKey: ['suggestions', 'pending'],
    queryFn: () => apiRequest<SuggestionRow[]>('/suggestions?status=pending'),
  });

  const bookingSuggestions = useMemo(
    () =>
      (suggestionsQuery.data ?? []).filter(
        (s) => s.aggregateType === 'Event' && s.aggregateId === id,
      ),
    [suggestionsQuery.data, id],
  );

  const invalidateBooking = () => {
    void queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    void queryClient.invalidateQueries({ queryKey: ['suggestions'] });
  };

  const activate = useMutation({
    mutationFn: () =>
      apiRequest<Booking>(`/bookings/${id}/activate`, {
        method: 'POST',
        body: JSON.stringify({ version: bookingQuery.data?.version }),
      }),
    onSuccess: () => {
      invalidateBooking();
      toast.push('Booking activated — review suggestions below');
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Activation failed',
        'error',
      ),
  });

  const acceptSuggestion = useMutation({
    mutationFn: ({
      suggestionId,
      assigneeId,
    }: {
      suggestionId: string;
      assigneeId?: string;
    }) =>
      apiRequest(`/suggestions/${suggestionId}/accept`, {
        method: 'POST',
        body: JSON.stringify(assigneeId ? { assigneeId } : {}),
      }),
    onSuccess: () => {
      invalidateBooking();
      toast.push('Suggestion accepted');
    },
  });

  const dismissSuggestion = useMutation({
    mutationFn: (suggestionId: string) =>
      apiRequest(`/suggestions/${suggestionId}/dismiss`, { method: 'POST' }),
    onSuccess: () => {
      invalidateBooking();
      toast.push('Suggestion dismissed');
    },
  });

  function handleAccept(item: SuggestionRow) {
    if (item.type === 'staff.assign') {
      const assigneeId = window.prompt(
        'Assignee user UUID',
        meQuery.data?.id ?? '',
      );
      if (!assigneeId?.trim()) {
        return;
      }
      acceptSuggestion.mutate({
        suggestionId: item.id,
        assigneeId: assigneeId.trim(),
      });
      return;
    }
    acceptSuggestion.mutate({ suggestionId: item.id });
  }

  const booking = bookingQuery.data;

  return (
    <div>
      {booking?.leadId ? (
        <Link
          to={`/leads/${booking.leadId}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Back to lead
        </Link>
      ) : (
        <Link to="/leads" className="text-sm text-brand-700 hover:underline">
          ← Leads
        </Link>
      )}

      {bookingQuery.isLoading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : null}
      {bookingQuery.error ? (
        <p className="mt-6 text-red-600">Booking not found.</p>
      ) : null}

      {booking ? (
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              Booking #{booking.bookingNumber}
            </h1>
            <StageBadge stage={booking.status} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Preparation</dt>
                <dd className="capitalize">
                  {booking.preparationStatus.replace(/_/g, ' ')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Event</dt>
                <dd>{booking.eventType ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Venue</dt>
                <dd>{booking.venueName ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Quotation</dt>
                <dd>
                  <Link
                    to={`/quotations/${booking.quotationId}`}
                    className="text-brand-700 hover:underline"
                  >
                    Open quotation
                  </Link>
                </dd>
              </div>
            </dl>
          </section>

          {booking.status === 'approved' ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-medium">Workspace</h2>
              <p className="mt-1 text-sm text-slate-600">
                Activates the booking (in preparation) and queues checklist and
                staff suggestions.
              </p>
              <button
                type="button"
                className="mt-3 rounded-md bg-brand-700 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                disabled={activate.isPending}
                onClick={() => activate.mutate()}
              >
                {activate.isPending ? 'Activating…' : 'Activate booking'}
              </button>
            </section>
          ) : null}

          {booking.status === 'in_preparation' ||
          bookingSuggestions.length > 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-medium">Suggestions for this booking</h2>
                <Link
                  to="/suggestions"
                  className="text-sm text-brand-700 hover:underline"
                >
                  All suggestions
                </Link>
              </div>
              {suggestionsQuery.isLoading ? (
                <p className="mt-3 text-sm text-slate-600">Loading…</p>
              ) : bookingSuggestions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-600">
                  No pending items for this booking.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {bookingSuggestions.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{suggestionTypeLabel(item.type)}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-md bg-brand-700 px-2 py-1 text-xs text-white disabled:opacity-50"
                          disabled={acceptSuggestion.isPending}
                          onClick={() => handleAccept(item)}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                          disabled={dismissSuggestion.isPending}
                          onClick={() =>
                            dismissSuggestion.mutate(item.id)
                          }
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
