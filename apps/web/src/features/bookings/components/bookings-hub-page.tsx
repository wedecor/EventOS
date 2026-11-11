'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { RequirePermission } from '@/features/auth';
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
import { bookingsApi } from '../api/bookings.api';
import type { Booking } from '../schemas/booking.schemas';

function formatStatus(status: Booking['status']): string {
  return status.replaceAll('_', ' ');
}

function formatDate(value: string | Date | null): string {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
}

export function BookingsHubPage() {
  const pathname = usePathname() ?? '/app/bookings/';
  const crumbs = buildBreadcrumbs(pathname);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ['bookings', 'list', page, q],
    queryFn: () =>
      bookingsApi.list({
        page,
        pageSize: 20,
        ...(q.trim() ? { q: q.trim() } : {}),
        sort: 'createdAt',
        order: 'desc',
      }),
    staleTime: 15_000,
  });

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      {
        accessorKey: 'bookingNumber',
        header: 'Booking #',
        cell: ({ row }) => (
          <Link
            className="underline-offset-2 hover:underline"
            href={`/app/bookings/view/?id=${encodeURIComponent(row.original.id)}`}
          >
            B-{row.original.bookingNumber}
          </Link>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => formatStatus(row.original.status),
      },
      {
        accessorKey: 'eventType',
        header: 'Event',
        cell: ({ row }) => row.original.eventType ?? '—',
      },
      {
        accessorKey: 'eventStartDate',
        header: 'Start',
        cell: ({ row }) => formatDate(row.original.eventStartDate),
      },
      {
        accessorKey: 'venueName',
        header: 'Venue',
        cell: ({ row }) => row.original.venueName ?? '—',
      },
    ],
    [],
  );

  const meta = query.data?.meta;

  return (
    <RequirePermission permission="bookings:read">
      <PageLayout>
        <PageHeader
          title="Bookings"
          description="Paginated event hubs from GET /api/v1/bookings. Create via approved quotation + confirmed advance."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Bookings">
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
                title="Unable to load bookings"
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
                title="No bookings found"
                description="Approve a quotation with confirmed advance, or refine search."
              />
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
              id="booking-id"
              label="Booking ID"
              submitLabel="Open booking"
              hrefForId={(id) => `/app/bookings/view/?id=${encodeURIComponent(id)}`}
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
