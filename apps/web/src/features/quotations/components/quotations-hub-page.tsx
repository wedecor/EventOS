'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { DataTable } from '@/shared/components/data-display/data-table';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  OpenByIdForm,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { quotationsApi } from '../api/quotations.api';
import { formatQuotationMoney, formatQuotationStatus } from '../lib/format';
import type { Quotation } from '../schemas/quotation.schemas';

export function QuotationsHubPage() {
  const pathname = usePathname() ?? '/app/quotations/';
  const crumbs = buildBreadcrumbs(pathname);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['quotations', 'list', page, q],
    queryFn: () =>
      quotationsApi.list({
        page,
        pageSize: 20,
        ...(q.trim() ? { q: q.trim() } : {}),
        sort: 'createdAt',
        order: 'desc',
      }),
    staleTime: 15_000,
  });

  const columns = useMemo<ColumnDef<Quotation>[]>(
    () => [
      {
        accessorKey: 'quotationNumber',
        header: 'Quote #',
        cell: ({ row }) => (
          <Link
            className="underline-offset-2 hover:underline"
            href={`/app/quotations/view/?id=${encodeURIComponent(row.original.id)}`}
          >
            Q-{row.original.quotationNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => formatQuotationStatus(row.original.status),
      },
      {
        accessorKey: 'totalAmount',
        header: 'Total',
        cell: ({ row }) =>
          formatQuotationMoney(row.original.totalAmount, row.original.currency),
      },
    ],
    [],
  );

  const meta = query.data?.meta;

  return (
    <RequirePermission permission="quotations:read">
      <PageLayout>
        <PageHeader
          title="Quotations"
          description="Paginated quotations from GET /api/v1/quotations."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="quotations:write">
              <Button asChild>
                <Link href="/app/quotations/new/">New quotation</Link>
              </Button>
            </Can>
          }
        />
        <PageSection>
          <ContentCard title="Quotations">
            <form
              className="mb-4 flex flex-wrap gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                void query.refetch();
              }}
            >
              <Input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Search venue, event type, notes"
                className="max-w-sm"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>
            {query.isLoading ? <LoadingState variant="skeleton" rows={5} /> : null}
            {query.isError ? (
              <ErrorState
                title="Unable to load quotations"
                description={
                  query.error instanceof ApiError
                    ? query.error.message
                    : 'Request failed.'
                }
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {query.isSuccess && query.data.data.length === 0 ? (
              <EmptyState title="No quotations found" description="Create one or refine search." />
            ) : null}
            {query.isSuccess && query.data.data.length > 0 ? (
              <>
                <DataTable columns={columns} data={query.data.data} />
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <p className="text-muted-foreground">
                    Page {meta?.page ?? page} of {meta?.totalPages ?? 1} · {meta?.total ?? 0} total
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={page <= 1 || query.isFetching}
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        !meta || page >= meta.totalPages || query.isFetching || meta.totalPages === 0
                      }
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </ContentCard>
        </PageSection>
        <PageSection>
          <ContentCard title="Open by ID">
            <OpenByIdForm
              id="quotation-id"
              label="Quotation ID"
              submitLabel="Open quotation"
              hrefForId={(id) => `/app/quotations/view/?id=${encodeURIComponent(id)}`}
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
