'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useVendorsQuery } from '../hooks/use-vendor-queries';
import { formatVendorStatus } from '../lib/format';
import {
  VENDOR_STATUSES,
  type ListVendorsQuery,
  type Vendor,
  type VendorStatus,
} from '../schemas/vendor.schemas';

const columns: ColumnDef<Vendor>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => formatVendorStatus(row.original.status),
  },
  {
    accessorKey: 'contactPhone',
    header: 'Phone',
    cell: ({ row }) => row.original.contactPhone ?? '—',
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link href={`/app/vendors/view/?id=${encodeURIComponent(row.original.id)}`}>
          View
        </Link>
      </Button>
    ),
  },
];

const selectClassName =
  'flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

/**
 * Vendor list — GET /vendors with optional status/category query filters.
 */
export function VendorsListPage() {
  const pathname = usePathname() ?? '/app/vendors/';
  const crumbs = buildBreadcrumbs(pathname);
  const [statusFilter, setStatusFilter] = useState<'' | VendorStatus>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('');

  const queryParams: ListVendorsQuery = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(appliedCategory.trim() ? { category: appliedCategory.trim() } : {}),
    }),
    [statusFilter, appliedCategory],
  );

  const query = useVendorsQuery(queryParams);
  const vendors = query.data ?? [];

  return (
    <RequirePermission permission="vendors:read">
      <PageLayout>
        <PageHeader
          title="Vendors"
          description="Vendor master from GET /api/v1/vendors. Procurement and expense workflows are deferred."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="vendors:write">
              <Button asChild>
                <Link href="/app/vendors/new/">New vendor</Link>
              </Button>
            </Can>
          }
        />

        <PageSection>
          <ContentCard title="Filters">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setAppliedCategory(categoryFilter);
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="vendor-status">
                  Status
                </label>
                <select
                  id="vendor-status"
                  className={selectClassName}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as '' | VendorStatus)
                  }
                >
                  <option value="">All</option>
                  {VENDOR_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatVendorStatus(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[12rem] flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="vendor-category">
                  Category
                </label>
                <Input
                  id="vendor-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  placeholder="Exact category match"
                />
              </div>
              <Button type="submit" variant="outline">
                Apply category
              </Button>
            </form>
          </ContentCard>
        </PageSection>

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={6} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load vendors"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && vendors.length === 0 ? (
            <EmptyState
              title="No vendors"
              description="Create a vendor, or clear filters if the list looks empty."
            />
          ) : null}
          {!query.isLoading && !query.isError && vendors.length > 0 ? (
            <DataTable
              columns={columns}
              data={vendors}
              emptyMessage="No vendors."
            />
          ) : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
