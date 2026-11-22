'use client';

import Link from 'next/link';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { useInventorySummaryQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import { Button } from '@/shared/components/ui/button';
import { CountBreakdownTable } from './count-breakdown-table';

export function InventorySummarySection() {
  const query = useInventorySummaryQuery();
  const data = query.data;

  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/app/inventory/">Open inventory</Link>
      </Button>
      <DashboardWidget
        title="Inventory summary"
        description="GET /api/v1/dashboards/inventory-summary"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <KpiCard
                label="Total movements"
                value={String(data.totalMovements)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Movements by status
              </p>
              <CountBreakdownTable record={data.byStatus} />
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
