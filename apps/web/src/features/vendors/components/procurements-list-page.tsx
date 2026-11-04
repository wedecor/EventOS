'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
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
import { useAllProcurementsQuery } from '../hooks/use-vendor-queries';
import { formatWorkflowStatus } from '../schemas/procurement.schemas';

export function ProcurementsListPage() {
  const pathname = usePathname() ?? '/app/vendors/procurements/';
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'Procurements' });
  const query = useAllProcurementsQuery();

  return (
    <RequirePermission permission="procurements:read">
      <PageLayout>
        <PageHeader
          title="Vendor procurements"
          description="Operational procurement workflow across bookings"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/vendors/">Vendors</Link>
            </Button>
          }
        />

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={4} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load procurements"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && (query.data ?? []).length === 0 ? (
            <EmptyState
              title="No procurements yet"
              description="Create procurements from Event Workspace by linking a vendor."
            />
          ) : null}
          {(query.data ?? []).length > 0 ? (
            <ContentCard title="All procurements">
              <ul className="space-y-2">
                {(query.data ?? []).map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/app/vendors/procurements/view/?id=${encodeURIComponent(row.id)}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/40"
                    >
                      <div>
                        <p className="font-medium capitalize">
                          {formatWorkflowStatus(row.workflowStatus)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.serviceCategory ?? 'Uncategorized'}
                          {row.costSummary?.estimatedCost != null
                            ? ` · Est. ${row.costSummary.estimatedCost} ${row.costSummary.currency}`
                            : ''}
                          {' · '}
                          Delivery {row.deliveryStatus}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(row.outstandingActions ?? []).length} action(s)
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ContentCard>
          ) : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
