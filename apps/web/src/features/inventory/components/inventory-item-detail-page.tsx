'use client';

import type { ReactNode } from 'react';
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
import { useInventoryItemQuery } from '../hooks/use-inventory-queries';
import {
  formatCondition,
  formatItemStatus,
  formatTaxonomy,
  formatWhen,
} from '../lib/format';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

export function InventoryItemDetailPage() {
  const pathname = usePathname() ?? '/app/inventory/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useInventoryItemQuery(id);

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data?.name ?? 'Item',
  });

  return (
    <RequirePermission permission="inventory:read">
      <PageLayout>
        <PageHeader
          title={query.data?.name ?? 'Inventory item'}
          description="Resolved via GET /api/v1/inventory/items (no GET-by-id in Phase 1)."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {id ? (
                <Can permission="inventory:write">
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/inventory/edit/?id=${encodeURIComponent(id)}`}
                    >
                      Edit
                    </Link>
                  </Button>
                </Can>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/inventory/">Back to list</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing item id"
              description="Open an item with ?id=<uuid>."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={6} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load item"
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
            <ContentCard title="Profile">
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Name" value={query.data.name} />
                <DetailField label="SKU" value={query.data.sku ?? '—'} />
                <DetailField label="Category" value={query.data.category} />
                <DetailField
                  label="Taxonomy"
                  value={formatTaxonomy(query.data.taxonomy)}
                />
                <DetailField label="Unit" value={query.data.unit} />
                <DetailField
                  label="Condition"
                  value={formatCondition(query.data.condition)}
                />
                <DetailField
                  label="Qty at JP Nagar"
                  value={String(query.data.quantityAtJpNagar)}
                />
                <DetailField
                  label="Status"
                  value={formatItemStatus(query.data.status)}
                />
                <DetailField
                  label="Version"
                  value={String(query.data.version)}
                />
                <DetailField
                  label="Created"
                  value={formatWhen(query.data.createdAt)}
                />
                <DetailField
                  label="Updated"
                  value={formatWhen(query.data.updatedAt)}
                />
              </dl>
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
