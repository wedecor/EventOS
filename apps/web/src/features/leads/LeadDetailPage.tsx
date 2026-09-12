import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { ApiError, apiRequest } from '../../shared/api/client';
import { useMe } from '../../shared/auth/useMe';
import type { Customer, FollowUp, Lead, Quotation } from '../../shared/types/domain';
import { LoadingPanel } from '../../shared/ui/LoadingPanel';
import { StageBadge } from '../../shared/ui/StageBadge';
import { useToast } from '../../shared/ui/Toast';

function formatDue(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const meQuery = useMe();
  const [followUpDue, setFollowUpDue] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');

  const leadQuery = useQuery({
    queryKey: ['leads', id],
    queryFn: () => apiRequest<Lead>(`/leads/${id}`),
    enabled: Boolean(id),
  });

  const customerId = leadQuery.data?.customerId;

  const customerQuery = useQuery({
    queryKey: ['clients', customerId],
    queryFn: () => apiRequest<Customer>(`/clients/${customerId}`),
    enabled: Boolean(customerId),
  });

  const latestQuotationQuery = useQuery({
    queryKey: ['leads', id, 'quotation'],
    queryFn: () => apiRequest<Quotation | null>(`/leads/${id}/quotation`),
    enabled: Boolean(id),
  });

  const followUpsQuery = useQuery({
    queryKey: ['leads', id, 'follow-ups'],
    queryFn: () => apiRequest<FollowUp[]>(`/leads/${id}/follow-ups`),
    enabled: Boolean(id),
  });

  const invalidateLead = () => {
    void queryClient.invalidateQueries({ queryKey: ['leads', id] });
    void queryClient.invalidateQueries({ queryKey: ['leads'] });
  };

  const changeStage = useMutation({
    mutationFn: (input: { stage: string; lostReason?: string | null }) =>
      apiRequest<Lead>(`/leads/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({
          stage: input.stage,
          lostReason: input.lostReason ?? null,
          version: leadQuery.data?.version,
        }),
      }),
    onSuccess: () => {
      invalidateLead();
      toast.push('Stage updated');
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Stage change failed',
        'error',
      ),
  });

  const assignLead = useMutation({
    mutationFn: (assigneeId: string) =>
      apiRequest<Lead>(`/leads/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({
          assigneeId,
          version: leadQuery.data?.version,
        }),
      }),
    onSuccess: () => {
      invalidateLead();
      toast.push('Lead assigned');
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Assign failed',
        'error',
      ),
  });

  const scheduleFollowUp = useMutation({
    mutationFn: () =>
      apiRequest<FollowUp>(`/leads/${id}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify({
          dueAt: new Date(followUpDue).toISOString(),
          notes: followUpNotes.trim() || null,
        }),
      }),
    onSuccess: () => {
      setFollowUpDue('');
      setFollowUpNotes('');
      void queryClient.invalidateQueries({
        queryKey: ['leads', id, 'follow-ups'],
      });
      toast.push('Follow-up scheduled');
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Could not schedule',
        'error',
      ),
  });

  const completeFollowUp = useMutation({
    mutationFn: (item: FollowUp) =>
      apiRequest<FollowUp>(`/follow-ups/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'done',
          version: item.version,
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['leads', id, 'follow-ups'],
      });
      toast.push('Follow-up marked done');
    },
  });

  const createQuotation = useMutation({
    mutationFn: () =>
      apiRequest<Quotation>('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customerId: leadQuery.data?.customerId,
          leadId: id,
          validUntil: '2099-12-31',
          eventType: leadQuery.data?.eventType,
          venue: leadQuery.data?.venue,
        }),
      }),
    onSuccess: (quotation) => {
      void queryClient.invalidateQueries({
        queryKey: ['leads', id, 'quotation'],
      });
      navigate(`/quotations/${quotation.id}`);
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Quotation failed',
        'error',
      ),
  });

  const lead = leadQuery.data;
  const pendingFollowUps =
    followUpsQuery.data?.filter((f) => f.status === 'pending') ?? [];

  function onScheduleFollowUp(e: FormEvent) {
    e.preventDefault();
    if (!followUpDue) {
      toast.push('Pick a due date and time', 'error');
      return;
    }
    scheduleFollowUp.mutate();
  }

  return (
    <div>
      <Link to="/leads" className="text-sm text-brand-700 hover:underline">
        ← All leads
      </Link>

      {leadQuery.isLoading ? (
        <div className="mt-6">
          <LoadingPanel label="Loading lead…" />
        </div>
      ) : null}
      {leadQuery.error ? (
        <p className="mt-6 text-red-600">Lead not found.</p>
      ) : null}

      {lead ? (
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {lead.eventType ?? 'Lead'}{' '}
                <span className="font-mono text-base text-slate-400">
                  {lead.id.slice(0, 8)}
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Source: {lead.source} · v{lead.version}
              </p>
            </div>
            <StageBadge stage={lead.stage} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Details</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Venue</dt>
                <dd>{lead.venue ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Guest count</dt>
                <dd>{lead.guestCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Customer</dt>
                <dd>
                  {lead.customerId ? (
                    customerQuery.isLoading ? (
                      <span className="text-slate-500">Loading…</span>
                    ) : customerQuery.data ? (
                      <Link
                        to={`/clients/${lead.customerId}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {customerQuery.data.displayName}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs">{lead.customerId}</span>
                    )
                  ) : (
                    'Not linked'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Assignee</dt>
                <dd>
                  {lead.assignedToId ? (
                    lead.assignedToId === meQuery.data?.id ? (
                      <span className="text-sm">
                        {meQuery.data.name}{' '}
                        <span className="text-slate-500">(you)</span>
                      </span>
                    ) : (
                      <span className="font-mono text-xs">{lead.assignedToId}</span>
                    )
                  ) : (
                    'Unassigned'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Notes</dt>
                <dd>{lead.notes ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Assignment</h2>
            <p className="mt-1 text-sm text-slate-600">
              Assign this lead to a team member (Sprint 1 uses user UUID).
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                disabled={assignLead.isPending || !meQuery.data?.id}
                onClick={() => {
                  if (meQuery.data?.id) {
                    assignLead.mutate(meQuery.data.id);
                  }
                }}
              >
                Assign to me
              </button>
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                disabled={assignLead.isPending}
                onClick={() => {
                  const assigneeId = window.prompt(
                    'Assignee user UUID',
                    meQuery.data?.id ?? '',
                  );
                  if (assigneeId?.trim()) {
                    assignLead.mutate(assigneeId.trim());
                  }
                }}
              >
                Assign to…
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Follow-ups</h2>
            {followUpsQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading…</p>
            ) : pendingFollowUps.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No pending follow-ups.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {pendingFollowUps.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{formatDue(item.dueAt)}</p>
                      {item.notes ? (
                        <p className="text-slate-600">{item.notes}</p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-emerald-700 px-2 py-1 text-xs text-white disabled:opacity-50"
                      disabled={completeFollowUp.isPending}
                      onClick={() => completeFollowUp.mutate(item)}
                    >
                      Mark done
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!['approved', 'completed', 'lost', 'cancelled'].includes(
              lead.stage,
            ) ? (
              <form
                className="mt-4 space-y-3 border-t border-slate-100 pt-4"
                onSubmit={onScheduleFollowUp}
              >
                <p className="text-sm font-medium">Schedule follow-up</p>
                <input
                  type="datetime-local"
                  className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={followUpDue}
                  onChange={(e) => setFollowUpDue(e.target.value)}
                  required
                />
                <textarea
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  rows={2}
                  placeholder="Notes (optional)"
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  disabled={scheduleFollowUp.isPending}
                >
                  Schedule
                </button>
              </form>
            ) : null}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Pipeline actions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead.stage === 'new' ? (
                <button
                  type="button"
                  className="rounded-md bg-brand-700 px-3 py-1.5 text-sm text-white hover:bg-brand-600"
                  disabled={changeStage.isPending}
                  onClick={() => changeStage.mutate({ stage: 'in_talks' })}
                >
                  Move to in talks
                </button>
              ) : null}
              {lead.stage === 'in_talks' ? (
                <>
                  <button
                    type="button"
                    className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-600"
                    disabled={changeStage.isPending}
                    onClick={() => changeStage.mutate({ stage: 'approved' })}
                  >
                    Approve lead (W5 gate)
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-800 hover:bg-red-50"
                    disabled={changeStage.isPending}
                    onClick={() => {
                      const reason =
                        window.prompt('Lost reason (optional)') ?? '';
                      changeStage.mutate({
                        stage: 'lost',
                        lostReason: reason.trim() || null,
                      });
                    }}
                  >
                    Mark lost
                  </button>
                </>
              ) : null}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Approval requires advance payment, approved quotation, and booking
              (EP1-BR-001, EP1-AUT-006).
            </p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Quotation</h2>
            {latestQuotationQuery.data ? (
              <p className="mt-2 text-sm">
                Latest:{' '}
                <Link
                  to={`/quotations/${latestQuotationQuery.data.id}`}
                  className="font-medium text-brand-700 hover:underline"
                >
                  #{latestQuotationQuery.data.quotationNumber} (
                  {latestQuotationQuery.data.status})
                </Link>
              </p>
            ) : latestQuotationQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-500">Checking quotation…</p>
            ) : null}
            {lead.customerId ? (
              <button
                type="button"
                className="mt-3 rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
                disabled={createQuotation.isPending}
                onClick={() => createQuotation.mutate()}
              >
                Create quotation
              </button>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Link a customer before creating a quotation.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
