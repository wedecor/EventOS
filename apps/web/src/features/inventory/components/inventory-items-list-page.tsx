'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
import { useInventoryItemsQuery } from '../hooks/use-inventory-queries';
import {
  formatItemStatus,
  formatTaxonomy,
} from '../lib/format';
import {
  INVENTORY_ITEM_STATUSES,
  INVENTORY_TAXONOMIES,
  type InventoryItem,
  type InventoryItemStatus,
  type InventoryTaxonomy,
  type ListInventoryItemsQuery,
} from '../schemas/inventory.schemas';

const columns: ColumnDef<InventoryItem>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'category', header: 'Category' },
  {
    accessorKey: 'taxonomy',
    header: 'Taxonomy',
    cell: ({ row }) => formatTaxonomy(row.original.taxonomy),
  },
  {
    accessorKey: 'quantityAtJpNagar',
    header: 'Qty (JP Nagar)',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => formatItemStatus(row.original.status),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <Button asChild variant="outline" size="sm">
        <Link
          href={`/app/inventory/view/?id=${encodeURIComponent(row.original.id)}`}
        >
          View
        </Link>
      </Button>
    ),
  },
];

const selectClassName =
  'flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

/**
 * Inventory master list + booking-scoped movements entry.
 */
export function InventoryItemsListPage() {
  const pathname = usePathname() ?? '/app/inventory/';
  const router = useRouter();
  const crumbs = buildBreadcrumbs(pathname);
  const [statusFilter, setStatusFilter] = useState<'' | InventoryItemStatus>('');
  const [taxonomyFilter, setTaxonomyFilter] = useState<'' | InventoryTaxonomy>(
    '',
  );
  const [categoryDraft, setCategoryDraft] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('');
  const [bookingId, setBookingId] = useState('');

  const queryParams: ListInventoryItemsQuery = useMemo(
    () => ({
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(taxonomyFilter ? { taxonomy: taxonomyFilter } : {}),
      ...(appliedCategory.trim() ? { category: appliedCategory.trim() } : {}),
    }),
    [statusFilter, taxonomyFilter, appliedCategory],
  );

  const query = useInventoryItemsQuery(queryParams);
  const items = query.data ?? [];

  const onOpenMovements = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = bookingId.trim();
    if (!trimmed) return;
    router.push(
      `/app/inventory/movements/?bookingId=${encodeURIComponent(trimmed)}`,
    );
  };

  return (
    <RequirePermission permission="inventory:read">
      <PageLayout>
        <PageHeader
          title="Inventory"
          description="Item master from GET /api/v1/inventory/items. Event movements are booking-scoped."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/app/inventory/operations/">Operations</Link>
              </Button>
              <Can permission="inventory:write">
                <Button asChild>
                  <Link href="/app/inventory/new/">New item</Link>
                </Button>
              </Can>
            </div>
          }
        />

        <PageSection>
          <ContentCard title="Filters">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <select
                  className={selectClassName}
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as '' | InventoryItemStatus)
                  }
                >
                  <option value="">All</option>
                  {INVENTORY_ITEM_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {formatItemStatus(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Taxonomy
                </label>
                <select
                  className={selectClassName}
                  value={taxonomyFilter}
                  onChange={(e) =>
                    setTaxonomyFilter(e.target.value as '' | InventoryTaxonomy)
                  }
                >
                  <option value="">All</option>
                  {INVENTORY_TAXONOMIES.map((value) => (
                    <option key={value} value={value}>
                      {formatTaxonomy(value)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[12rem] flex-1 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Category
                </label>
                <Input
                  value={categoryDraft}
                  onChange={(e) => setCategoryDraft(e.target.value)}
                  placeholder="Exact category filter"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAppliedCategory(categoryDraft)}
              >
                Apply
              </Button>
            </div>
          </ContentCard>
        </PageSection>

        <PageSection>
          <ContentCard title="Items">
            {query.isLoading ? (
              <LoadingState variant="skeleton" rows={5} />
            ) : null}
            {query.isError ? (
              <ErrorState
                title="Unable to load inventory"
                description={
                  query.error instanceof ApiError
                    ? query.error.message
                    : 'Request failed.'
                }
                onRetry={() => void query.refetch()}
              />
            ) : null}
            {query.isSuccess && items.length === 0 ? (
              <EmptyState
                title="No inventory items"
                description="Create an item or clear filters."
              />
            ) : null}
            {query.isSuccess && items.length > 0 ? (
              <DataTable columns={columns} data={items} />
            ) : null}
          </ContentCard>
        </PageSection>

        <PageSection>
          <ContentCard title="Booking movements">
            <p className="mb-3 text-xs text-muted-foreground">
              There is no global movement list. Open movements for a booking via
              GET /api/v1/bookings/:id/inventory-movements.
            </p>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={onOpenMovements}
            >
              <div className="min-w-[16rem] flex-1 space-y-1">
                <label
                  className="text-xs font-medium text-muted-foreground"
                  htmlFor="booking-id-movements"
                >
                  Booking ID
                </label>
                <Input
                  id="booking-id-movements"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="UUID"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={!bookingId.trim()}>
                Open movements
              </Button>
            </form>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
