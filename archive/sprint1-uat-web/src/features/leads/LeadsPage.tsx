import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../shared/api/client';
import type { Lead } from '../../shared/types/domain';
import { LoadingPanel } from '../../shared/ui/LoadingPanel';
import { StageBadge } from '../../shared/ui/StageBadge';

export function LeadsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leads', { include: 'customer' }],
    queryFn: () => apiRequest<Lead[]>('/leads?include=customer'),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-600">W5 pipeline</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/leads/new"
            className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-600"
          >
            New lead
          </Link>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
          >
            Refresh
          </button>
        </div>
      </div>

      {isLoading ? <LoadingPanel label="Loading leads…" /> : null}
      {error ? (
        <p className="text-red-600" role="alert">
          Could not load leads.
        </p>
      ) : null}

      {data && data.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
          No leads yet.{' '}
          <Link to="/leads/new" className="text-brand-700 hover:underline">
            Create one
          </Link>
          .
        </p>
      ) : null}

      {data && data.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {data.map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-4 py-3">{lead.source}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/leads/${lead.id}`}
                      className="font-medium text-brand-800 hover:underline"
                    >
                      {lead.eventType ?? 'View lead'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {lead.customerId ? (
                      lead.customerDisplayName ? (
                        <Link
                          to={`/clients/${lead.customerId}`}
                          className="text-brand-700 hover:underline"
                        >
                          {lead.customerDisplayName}
                        </Link>
                      ) : (
                        <span className="font-mono text-xs text-slate-500">
                          {lead.customerId.slice(0, 8)}…
                        </span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {lead.assignedToId
                      ? `${lead.assignedToId.slice(0, 8)}…`
                      : '—'}
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
