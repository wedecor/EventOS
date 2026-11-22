'use client';

import { useMemo, useState } from 'react';
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
import { useStaffListQuery } from '../hooks/use-staff-queries';
import { formatEmploymentType, formatStaffStatus } from '../lib/format';
import {
  STAFF_STATUSES,
  type ListStaffQuery,
  type StaffMember,
  type StaffStatus,
} from '../schemas/staff.schemas';

const columns: ColumnDef<StaffMember>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'role', header: 'Operational role' },
  {
    accessorKey: 'employmentType',
    header: 'Employment',
    cell: ({ row }) => formatEmploymentType(row.original.employmentType),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => formatStaffStatus(row.original.status),
  },
  { accessorKey: 'phone', header: 'Phone' },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/staff/view/?id=${encodeURIComponent(row.original.id)}`}>
          View
        </Link>
      </Button>
    ),
  },
];

const selectClassName =
  'flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

/**
 * Staff list — GET /staff with optional status filter.
 * Assignments are deferred (booking-scoped API).
 */
export function StaffListPage() {
  const pathname = usePathname() ?? '/app/staff/';
  const crumbs = buildBreadcrumbs(pathname);
  const [statusFilter, setStatusFilter] = useState<'' | StaffStatus>('');

  const queryParams: ListStaffQuery = useMemo(
    () => (statusFilter ? { status: statusFilter } : {}),
    [statusFilter],
  );

  const query = useStaffListQuery(queryParams);
  const members = query.data ?? [];

  return (
    <RequirePermission permission="staff:read">
      <PageLayout>
        <PageHeader
          title="Staff"
          description="Staff master — permanent and temporary workforce profiles. Event assignments use StaffMember ids."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="staff:write">
              <Button asChild>
                <Link href="/app/staff/new/">New staff</Link>
              </Button>
            </Can>
          }
        />

        <PageSection>
          <ContentCard title="Filters">
            <div className="space-y-1">
              <label
                className="text-xs font-medium text-muted-foreground"
                htmlFor="staff-status"
              >
                Status
              </label>
              <select
                id="staff-status"
                className={selectClassName}
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as '' | StaffStatus)
                }
              >
                <option value="">All</option>
                {STAFF_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {formatStaffStatus(status)}
                  </option>
                ))}
              </select>
            </div>
          </ContentCard>
        </PageSection>

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={6} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load staff"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && members.length === 0 ? (
            <EmptyState
              title="No staff members"
              description="Create a staff member, or clear the status filter."
            />
          ) : null}
          {!query.isLoading && !query.isError && members.length > 0 ? (
            <DataTable
              columns={columns}
              data={members}
              emptyMessage="No staff members."
            />
          ) : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
