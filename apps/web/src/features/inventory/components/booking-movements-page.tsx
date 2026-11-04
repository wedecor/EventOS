'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
import { useBookingMovementsQuery } from '../hooks/use-inventory-queries';
import { formatMovementStatus } from '../lib/format';
import type { InventoryMovement } from '../schemas/inventory.schemas';

const columns: ColumnDef<InventoryMovement>[] = [
  {
    accessorKey: 'inventoryItemId',
    header: 'Item ID',
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.inventoryItemId}</span>
    ),
  },
  { accessorKey: 'quantity', header: 'Qty' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => formatMovementStatus(row.original.status),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/app/inventory/movements/view/?id=${encodeURIComponent(row.original.id)}`}
        >
          View
        </Link>
      </Button>
    ),
  },
];

export function BookingMovementsPage() {
  const pathname = usePathname() ?? '/app/inventory/movements/';
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const query = useBookingMovementsQuery(bookingId);
  const movements = query.data ?? [];

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: bookingId ? 'Booking movements' : 'Movements',
  });

  return (
    <RequirePermission permission="inventory:read">
      <PageLayout>
        <PageHeader
          title="Booking inventory movements"
          description="GET /api/v1/bookings/:id/inventory-movements"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {bookingId ? (
                <Can permission="inventory:move:write">
                  <Button asChild>
                    <Link
                      href={`/app/inventory/movements/new/?bookingId=${encodeURIComponent(bookingId)}`}
                    >
                      Plan movement
                    </Link>
                  </Button>
                </Can>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/inventory/">Back to inventory</Link>
              </Button>
              {bookingId ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/bookings/view/?id=${encodeURIComponent(bookingId)}`}
                  >
                    Booking
                  </Link>
                </Button>
              ) : null}
            </div>
          }
        />

        {!bookingId ? (
          <PageSection>
            <EmptyState
              title="Missing booking id"
              description="Open movements with ?bookingId=<uuid> from Inventory or a booking."
            />
          </PageSection>
        ) : null}

        {bookingId ? (
          <PageSection>
            <ContentCard
              title="Movements"
              description={`Booking ${bookingId}`}
            >
              {query.isLoading ? (
                <LoadingState variant="skeleton" rows={4} />
              ) : null}
              {query.isError ? (
                <ErrorState
                  title="Unable to load movements"
                  description={
                    query.error instanceof ApiError
                      ? query.error.message
                      : 'Request failed.'
                  }
                  onRetry={() => void query.refetch()}
                />
              ) : null}
              {query.isSuccess && movements.length === 0 ? (
                <EmptyState
                  title="No movements for this booking"
                  description="Plan a movement to start Planned → … → Cleaned/Ready."
                />
              ) : null}
              {query.isSuccess && movements.length > 0 ? (
                <DataTable columns={columns} data={movements} />
              ) : null}
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
