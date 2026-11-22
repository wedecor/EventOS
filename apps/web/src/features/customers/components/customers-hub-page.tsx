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
import { customersApi } from '../api/customers.api';
import type { Customer } from '../schemas/customer.schemas';

export function CustomersHubPage() {
  const pathname = usePathname() ?? '/app/customers/';
  const crumbs = buildBreadcrumbs(pathname);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const query = useQuery({
    queryKey: ['customers', 'list', page, q],
    queryFn: () =>
      customersApi.list({
        page,
        pageSize,
        ...(q.trim() ? { q: q.trim() } : {}),
        sort: 'createdAt',
        order: 'desc',
      }),
    staleTime: 15_000,
  });

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'displayName',
        header: 'Name',
        cell: ({ row }) => (
          <Link
            className="underline-offset-2 hover:underline"
            href={`/app/customers/view/?id=${encodeURIComponent(row.original.id)}`}
          >
            {row.original.displayName}
          </Link>
        ),
      },
      {
        accessorKey: 'primaryPhone',
        header: 'Phone',
        cell: ({ row }) => row.original.primaryPhone ?? '—',
      },
      {
        accessorKey: 'primaryEmail',
        header: 'Email',
        cell: ({ row }) => row.original.primaryEmail ?? '—',
      },
      {
        accessorKey: 'status',
        header: 'Status',
      },
    ],
    [],
  );

  const meta = query.data?.meta;

  return (
    <RequirePermission permission="clients:read">
      <PageLayout>
        <PageHeader
          title="Customers"
          description="Paginated customer directory from GET /api/v1/clients."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="clients:write">
              <Button asChild>
                <Link href="/app/customers/new/">New customer</Link>
              </Button>
            </Can>
          }
        />
        <PageSection>
          <ContentCard title="Customers">
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
                placeholder="Search name, phone, or email"
                className="max-w-sm"
              />
              <Button type="submit" variant="outline">
                Search
              </Button>
            </form>

            {query.isLoading ? <LoadingState variant="skeleton" rows={5} /> : null}
            {query.isError ? (
              <ErrorState
                title="Unable to load customers"
                description={
                  query.error instanceof ApiError
                    ? query.error.message
                    : 'Request failed.'
                }
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {query.isSuccess && query.data.data.length === 0 ? (
              <EmptyState
                title="No customers found"
                description="Create a customer or adjust your search."
              />
            ) : null}
            {query.isSuccess && query.data.data.length > 0 ? (
              <>
                <DataTable columns={columns} data={query.data.data} />
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <p className="text-muted-foreground">
                    Page {meta?.page ?? page} of {meta?.totalPages ?? 1} ·{' '}
                    {meta?.total ?? 0} total
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
                        !meta ||
                        page >= meta.totalPages ||
                        query.isFetching ||
                        meta.totalPages === 0
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
              id="customer-id"
              label="Customer ID"
              submitLabel="Open customer"
              hrefForId={(id) =>
                `/app/customers/view/?id=${encodeURIComponent(id)}`
              }
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
