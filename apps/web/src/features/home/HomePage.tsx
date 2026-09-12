import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { apiRequest } from '../../shared/api/client';
import type { Lead } from '../../shared/types/domain';
import { LoadingPanel } from '../../shared/ui/LoadingPanel';

type SuggestionRow = { id: string; status: string };

export function HomePage() {
  const leadsQuery = useQuery({
    queryKey: ['leads', { include: 'customer' }],
    queryFn: () => apiRequest<Lead[]>('/leads?include=customer'),
  });

  const suggestionsQuery = useQuery({
    queryKey: ['suggestions', 'pending'],
    queryFn: () => apiRequest<SuggestionRow[]>('/suggestions?status=pending'),
  });

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leadsQuery.data ?? []) {
      counts.set(lead.stage, (counts.get(lead.stage) ?? 0) + 1);
    }
    return counts;
  }, [leadsQuery.data]);

  const loading = leadsQuery.isLoading || suggestionsQuery.isLoading;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Today</h1>
      <p className="mt-1 text-sm text-slate-600">Sprint 1 W5 snapshot</p>

      {loading ? (
        <div className="mt-6">
          <LoadingPanel label="Loading dashboard…" />
        </div>
      ) : null}

      {!loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Leads"
            value={String(leadsQuery.data?.length ?? 0)}
            href="/leads"
          />
          <StatCard
            label="In talks"
            value={String(stageCounts.get('in_talks') ?? 0)}
            href="/leads"
          />
          <StatCard
            label="Approved"
            value={String(stageCounts.get('approved') ?? 0)}
            href="/leads"
          />
          <StatCard
            label="Pending suggestions"
            value={String(suggestionsQuery.data?.length ?? 0)}
            href="/suggestions"
          />
        </div>
      ) : null}

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-medium text-slate-900">Quick actions</h2>
        <ul className="mt-3 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              to="/leads/new"
              className="text-brand-700 hover:underline"
            >
              New lead
            </Link>
          </li>
          <li>
            <Link to="/clients" className="text-brand-700 hover:underline">
              Clients
            </Link>
          </li>
          <li>
            <Link to="/suggestions" className="text-brand-700 hover:underline">
              Review suggestions
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-slate-900">{value}</p>
    </Link>
  );
}
