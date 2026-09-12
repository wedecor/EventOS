import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, apiRequest } from '../../shared/api/client';
import type { Customer, Lead } from '../../shared/types/domain';

type CustomerLinkMode = 'none' | 'existing' | 'new';

export function CreateLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [source, setSource] = useState('website');
  const [eventType, setEventType] = useState('wedding');
  const [customerMode, setCustomerMode] = useState<CustomerLinkMode>('new');
  const [existingCustomerId, setExistingCustomerId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiRequest<Customer[]>('/clients'),
  });

  const create = useMutation({
    mutationFn: async () => {
      let customerId: string | null = null;

      if (customerMode === 'existing') {
        if (!existingCustomerId) {
          throw new ApiError('Select a client.', 400, 'VALIDATION_ERROR');
        }
        customerId = existingCustomerId;
      } else if (customerMode === 'new') {
        const name = displayName.trim();
        const phoneVal = phone.trim();
        if (name || phoneVal) {
          if (!name || !phoneVal) {
            throw new ApiError(
              'Customer name and phone are both required when creating a new client.',
              400,
              'VALIDATION_ERROR',
            );
          }
          const customer = await apiRequest<{ id: string }>('/clients', {
            method: 'POST',
            body: JSON.stringify({
              displayName: name,
              primaryPhone: phoneVal,
            }),
          });
          customerId = customer.id;
        }
      }

      return apiRequest<Lead>('/leads', {
        method: 'POST',
        body: JSON.stringify({
          source,
          eventType: eventType || null,
          customerId,
        }),
      });
    },
    onSuccess: (lead) => {
      void queryClient.invalidateQueries({ queryKey: ['leads'] });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigate(`/leads/${lead.id}`);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not create lead.');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    create.mutate();
  }

  return (
    <div>
      <Link to="/leads" className="text-sm text-brand-700 hover:underline">
        ← Back to leads
      </Link>
      <h1 className="mt-4 text-2xl font-semibold">New lead</h1>
      <form
        className="mt-6 max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6"
        onSubmit={onSubmit}
      >
        <label className="block text-sm font-medium">
          Source
          <select
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="website">Website</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="referral">Referral</option>
            <option value="phone">Phone</option>
            <option value="manual">Manual</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Event type
          <input
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
        </label>

        <hr className="border-slate-100" />
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-900">Customer</legend>
          <div className="flex flex-wrap gap-4 text-sm">
            {(
              [
                ['none', 'No customer'],
                ['existing', 'Existing client'],
                ['new', 'New client'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="customerMode"
                  checked={customerMode === value}
                  onChange={() => setCustomerMode(value)}
                />
                {label}
              </label>
            ))}
          </div>

          {customerMode === 'existing' ? (
            <label className="block text-sm font-medium">
              Client
              <select
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                value={existingCustomerId}
                onChange={(e) => setExistingCustomerId(e.target.value)}
                required
              >
                <option value="">Select…</option>
                {clientsQuery.data?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.displayName}
                    {client.primaryPhone ? ` · ${client.primaryPhone}` : ''}
                  </option>
                ))}
              </select>
              {clientsQuery.isLoading ? (
                <span className="mt-1 block text-xs text-slate-500">
                  Loading clients…
                </span>
              ) : null}
              {clientsQuery.data?.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">
                  No clients yet — choose “New client” or{' '}
                  <Link to="/clients" className="text-brand-700 hover:underline">
                    add one
                  </Link>
                  .
                </p>
              ) : null}
            </label>
          ) : null}

          {customerMode === 'new' ? (
            <>
              <p className="text-xs text-slate-500">
                Leave blank to create a lead without a linked customer.
              </p>
              <label className="block text-sm font-medium">
                Customer name
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Phone
                <input
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </>
          ) : null}
        </fieldset>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {create.isPending ? 'Creating…' : 'Create lead'}
        </button>
      </form>
    </div>
  );
}
