import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiRequest } from '../../shared/api/client';
import type { Customer } from '../../shared/types/domain';
import { useToast } from '../../shared/ui/Toast';

type AddContactResult = {
  id: string;
  contactsCount: number;
};

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');

  const clientQuery = useQuery({
    queryKey: ['clients', id],
    queryFn: () => apiRequest<Customer>(`/clients/${id}`),
    enabled: Boolean(id),
  });

  const addContact = useMutation({
    mutationFn: () =>
      apiRequest<AddContactResult>(`/clients/${id}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          name: contactName.trim(),
          role: contactRole.trim() || undefined,
        }),
      }),
    onSuccess: (result) => {
      setContactName('');
      setContactRole('');
      toast.push(`Contact added (${result.contactsCount} total)`);
      void queryClient.invalidateQueries({ queryKey: ['clients', id] });
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Could not add contact',
        'error',
      ),
  });

  const client = clientQuery.data;

  function onAddContact(e: FormEvent) {
    e.preventDefault();
    if (!contactName.trim()) {
      return;
    }
    addContact.mutate();
  }

  return (
    <div>
      <Link to="/clients" className="text-sm text-brand-700 hover:underline">
        ← All clients
      </Link>

      {clientQuery.isLoading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : null}
      {clientQuery.error ? (
        <p className="mt-6 text-red-600">Client not found.</p>
      ) : null}

      {client ? (
        <div className="mt-4 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {client.displayName}
            </h1>
            <p className="mt-1 text-sm capitalize text-slate-600">
              {client.type} · {client.status} · v{client.version}
            </p>
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Contact details</h2>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Phone</dt>
                <dd>{client.primaryPhone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd>
                  {client.primaryEmail ? (
                    <a
                      href={`mailto:${client.primaryEmail}`}
                      className="text-brand-700 hover:underline"
                    >
                      {client.primaryEmail}
                    </a>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Notes</dt>
                <dd>{client.notes ?? '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium text-slate-900">Add contact person</h2>
            <p className="mt-1 text-xs text-slate-500">
              Secondary contacts for planners, family, etc. (Sprint 1 — name and
              role only).
            </p>
            <form
              className="mt-3 flex flex-wrap gap-3"
              onSubmit={onAddContact}
            >
              <input
                className="min-w-[10rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
              />
              <input
                className="min-w-[8rem] rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Role (optional)"
                value={contactRole}
                onChange={(e) => setContactRole(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={addContact.isPending}
              >
                Add contact
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
