'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
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
import { useCustomerQuery } from '../hooks/use-customer-queries';

function formatWhen(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function CustomerDetailPage() {
  const pathname = usePathname() ?? '/app/customers/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useCustomerQuery(id);
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data?.displayName ?? 'Customer',
  });

  return (
    <RequirePermission permission="clients:read">
      <PageLayout>
        <PageHeader
          title={query.data?.displayName ?? 'Customer'}
          description="Customer profile from GET /api/v1/clients/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            id ? (
              <Can permission="clients:write">
                <Button asChild variant="outline">
                  <Link href={`/app/customers/edit/?id=${encodeURIComponent(id)}`}>
                    Edit
                  </Link>
                </Button>
              </Can>
            ) : null
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing customer id"
              description="Open a customer with ?id=<uuid>. List browsing is not available until GET /clients ships."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={5} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load customer"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          </PageSection>
        ) : null}

        {id && query.data ? (
          <PageSection>
            <ContentCard title="Basic information">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Name</dt>
                  <dd className="text-sm">{query.data.displayName}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Status</dt>
                  <dd className="text-sm">{query.data.status}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Type</dt>
                  <dd className="text-sm">{query.data.type}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Version</dt>
                  <dd className="text-sm tabular-nums">{query.data.version}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                  <dd className="text-sm">{query.data.primaryEmail ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
                  <dd className="text-sm">{query.data.primaryPhone ?? '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-medium text-muted-foreground">Notes</dt>
                  <dd className="text-sm whitespace-pre-wrap">{query.data.notes ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Created</dt>
                  <dd className="text-sm">{formatWhen(query.data.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Updated</dt>
                  <dd className="text-sm">{formatWhen(query.data.updatedAt)}</dd>
                </div>
              </dl>
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
