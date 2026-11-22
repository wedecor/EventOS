'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
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
import { useAllMovementsQuery } from '../hooks/use-inventory-queries';
import { formatMovementStatus, formatWhen } from '../lib/format';
import {
  bucketMovementStatus,
  type InventoryMovement,
  type MovementStatus,
} from '../schemas/inventory.schemas';

const SECTIONS: Array<{
  key: ReturnType<typeof bucketMovementStatus>;
  title: string;
  description: string;
}> = [
  {
    key: 'reservations',
    title: 'Reservations & pick',
    description: 'Planned and picked stock waiting to pack',
  },
  {
    key: 'packing',
    title: 'Packing',
    description: 'Packing started through ready for dispatch',
  },
  {
    key: 'dispatch',
    title: 'Dispatch',
    description: 'Loaded, dispatched, and at venue',
  },
  {
    key: 'returns',
    title: 'Returns',
    description: 'Returned, verified, and restocked',
  },
  {
    key: 'damage',
    title: 'Damage',
    description: 'Movements with reported damage quantities',
  },
];

function MovementRow({ movement }: { movement: InventoryMovement }) {
  return (
    <li>
      <Link
        href={`/app/inventory/movements/view/?id=${encodeURIComponent(movement.id)}`}
        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/40"
      >
        <div>
          <p className="font-medium">
            {formatMovementStatus(movement.status as MovementStatus)}
          </p>
          <p className="text-xs text-muted-foreground">
            Qty {movement.quantity}
            {movement.vehicle ? ` · ${movement.vehicle}` : ''}
            {movement.driverName ? ` · ${movement.driverName}` : ''}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatWhen(movement.updatedAt)}
        </p>
      </Link>
    </li>
  );
}

export function InventoryOpsDashboardPage() {
  const pathname = usePathname() ?? '/app/inventory/operations/';
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: 'Inventory operations',
  });
  const query = useAllMovementsQuery();

  const buckets = useMemo(() => {
    const movements = query.data ?? [];
    const map: Record<
      'reservations' | 'packing' | 'dispatch' | 'returns' | 'damage' | 'other',
      InventoryMovement[]
    > = {
      reservations: [],
      packing: [],
      dispatch: [],
      returns: [],
      damage: [],
      other: [],
    };
    for (const movement of movements) {
      if ((movement.damagedQuantity ?? 0) > 0) {
        map.damage.push(movement);
      }
      const bucket = bucketMovementStatus(movement.status);
      map[bucket].push(movement);
    }
    return map;
  }, [query.data]);

  return (
    <RequirePermission permission="inventory:read">
      <PageLayout>
        <PageHeader
          title="Inventory operations"
          description="Reservations, packing, dispatch, returns, and damage across events"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href="/app/inventory/">Items</Link>
              </Button>
              <Button asChild>
                <Link href="/app/inventory/movements/new/">Plan movement</Link>
              </Button>
            </div>
          }
        />

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={4} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load inventory operations"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading &&
          !query.isError &&
          (query.data ?? []).length === 0 ? (
            <EmptyState
              title="No movements yet"
              description="Plan inventory movements from a booking or Event Workspace."
            />
          ) : null}
        </PageSection>

        {SECTIONS.map((section) => {
          const rows = buckets[section.key] ?? [];
          if (rows.length === 0) return null;
          return (
            <PageSection key={section.key}>
              <ContentCard title={section.title} description={section.description}>
                <ul className="space-y-2">
                  {rows.map((movement) => (
                    <MovementRow key={movement.id} movement={movement} />
                  ))}
                </ul>
              </ContentCard>
            </PageSection>
          );
        })}
      </PageLayout>
    </RequirePermission>
  );
}
