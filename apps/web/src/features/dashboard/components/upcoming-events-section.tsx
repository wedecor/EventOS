'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-display/data-table';
import { DashboardWidget } from './dashboard-widget';
import { useUpcomingEventsQuery } from '../hooks/use-dashboard-queries';
import { formatEventDate, formatLabel } from '../lib/format';
import type { UpcomingEvents } from '../schemas/dashboard.schemas';

type UpcomingRow = UpcomingEvents['items'][number];

const columns: ColumnDef<UpcomingRow>[] = [
  {
    accessorKey: 'bookingNumber',
    header: 'Booking #',
  },
  {
    accessorKey: 'eventStartDate',
    header: 'Date',
    cell: ({ row }) => formatEventDate(row.original.eventStartDate),
  },
  {
    accessorKey: 'eventType',
    header: 'Event type',
    cell: ({ row }) => row.original.eventType ?? '—',
  },
  {
    accessorKey: 'venueName',
    header: 'Venue',
    cell: ({ row }) => row.original.venueName ?? '—',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => formatLabel(row.original.status),
  },
  {
    accessorKey: 'preparationStatus',
    header: 'Preparation',
    cell: ({ row }) => formatLabel(row.original.preparationStatus),
  },
];

/** Upcoming events from frozen API — no customer column (not in response contract). */
export function UpcomingEventsSection() {
  const query = useUpcomingEventsQuery(30);
  const items = query.data?.items ?? [];

  return (
    <DashboardWidget
      title="Upcoming events"
      description="Next 30 days (GET /dashboards/upcoming-events)"
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      isEmpty={!query.isLoading && !query.isError && items.length === 0}
      emptyTitle="No upcoming events"
      emptyDescription="Events with a start date in the next 30 days will appear here."
      onRetry={() => void query.refetch()}
    >
      <DataTable columns={columns} data={items} emptyMessage="No upcoming events." />
    </DashboardWidget>
  );
}
