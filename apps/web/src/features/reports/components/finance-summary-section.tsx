'use client';

import Link from 'next/link';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { formatMoney } from '@/features/dashboard/lib/format';
import { useFinanceSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import { Button } from '@/shared/components/ui/button';
import { CountBreakdownTable } from './count-breakdown-table';

export function FinanceSummarySection() {
  const query = useFinanceSummaryQuery();
  const data = query.data;

  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/app/finance/">Open finance hub</Link>
      </Button>
      <DashboardWidget
        title="Finance summary"
        description="GET /api/v1/dashboards/finance-summary — confirmed revenue / expenses / margin"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Confirmed revenue"
                value={formatMoney(data.totalConfirmedRevenue)}
              />
              <KpiCard
                label="Confirmed vendor expenses"
                value={formatMoney(data.totalConfirmedVendorExpenses)}
              />
              <KpiCard label="Gross margin" value={formatMoney(data.grossMargin)} />
              <KpiCard label="Invoices" value={String(data.invoices.total)} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Invoices by status
              </p>
              <CountBreakdownTable record={data.invoices.byStatus} />
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
