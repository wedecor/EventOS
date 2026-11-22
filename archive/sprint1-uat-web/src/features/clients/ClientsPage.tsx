import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../shared/api/client';
import type { Customer } from '../../shared/types/domain';

export function ClientsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiRequest<Customer[]>('/clients'),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Clients</h1>
        <p className="text-sm text-slate-600">Customers linked to leads and quotations</p>
      </div>

      {isLoading ? <p className="text-slate-600">Loading clients…</p> : null}
      {error ? (
        <p className="text-red-600" role="alert">
          Could not load clients.
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No clients yet. Create a lead with customer details to add one.
        </p>
      ) : null}

      {data && data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {data.map((client) => (
                <tr key={client.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      to={`/clients/${client.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {client.displayName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{client.primaryPhone ?? '—'}</td>
                  <td className="px-4 py-3">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

    </div>
  );
}
