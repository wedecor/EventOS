'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { DataTable } from '@/shared/components/data-display/data-table';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useLeadsQuery } from '../hooks/use-lead-queries';
import { formatBudget, formatLeadDate, formatLeadLabel } from '../lib/format';
import type { Lead } from '../schemas/lead.schemas';

const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => formatLeadLabel(row.original.stage),
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }) => formatLeadLabel(row.original.source),
  },
  {
    accessorKey: 'eventType',
    header: 'Event type',
    cell: ({ row }) => row.original.eventType ?? '—',
  },
  {
    accessorKey: 'eventStartDate',
    header: 'Event start',
    cell: ({ row }) => formatLeadDate(row.original.eventStartDate),
  },
  {
    id: 'budget',
    header: 'Budget',
    cell: ({ row }) =>
      formatBudget(
        row.original.estimatedBudgetAmount,
        row.original.estimatedBudgetCurrency,
      ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/leads/view/?id=${encodeURIComponent(row.original.id)}`}>
          View
        </Link>
      </Button>
    ),
  },
];

/**
 * Lead list — GET /leads returns the full tenant set (no server pagination/search).
 * Do not invent client-side filters for server-owned query semantics.
 */
export function LeadsListPage() {
  const pathname = usePathname() ?? '/app/leads/';
  const query = useLeadsQuery();
  const crumbs = buildBreadcrumbs(pathname);
  const leads = query.data ?? [];

  return (
    <RequirePermission permission="leads:read">
      <PageLayout>
        <PageHeader
          title="Leads"
          description="Tenant lead list from GET /api/v1/leads (no server-side search or pagination in Phase 1)."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="leads:write">
              <Button asChild>
                <Link href="/app/leads/new/">New lead</Link>
              </Button>
            </Can>
          }
        />

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={6} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load leads"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && leads.length === 0 ? (
            <ContentCard>
              <EmptyState
                title="No leads yet"
                description="Create a lead to start the sales pipeline."
              />
              <div className="mt-4">
                <Can permission="leads:write">
                  <Button asChild>
                    <Link href="/app/leads/new/">New lead</Link>
                  </Button>
                </Can>
              </div>
            </ContentCard>
          ) : null}
          {!query.isLoading && !query.isError && leads.length > 0 ? (
            <ContentCard>
              <DataTable columns={columns} data={leads} />
            </ContentCard>
          ) : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
