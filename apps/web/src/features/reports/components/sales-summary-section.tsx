'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import {
  formatConversionRate,
} from '@/features/dashboard/lib/format';
import { useSalesSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { CountBreakdownTable } from './count-breakdown-table';

const DEFAULT_DAYS = 30;

export function SalesSummarySection() {
  const [daysInput, setDaysInput] = useState(String(DEFAULT_DAYS));
  const [days, setDays] = useState(DEFAULT_DAYS);
  const query = useSalesSummaryQuery(days);
  const data = query.data;

  const applyDays = () => {
    const parsed = Number.parseInt(daysInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 365) return;
    setDays(parsed);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="sales-days">
            Period days (API `days`, max 365)
          </label>
          <Input
            id="sales-days"
            type="number"
            min={1}
            max={365}
            className="w-32"
            value={daysInput}
            onChange={(e) => setDaysInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyDays}>
          Apply
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/leads/">Open leads</Link>
        </Button>
      </div>

      <DashboardWidget
        title="Sales summary"
        description="GET /api/v1/dashboards/sales-summary"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total leads" value={String(data.totalLeads)} />
              <KpiCard
                label="New in period"
                value={String(data.newLeadsInPeriod)}
                hint={`${data.periodDays} day window`}
              />
              <KpiCard label="Converted" value={String(data.convertedLeads)} />
              <KpiCard
                label="Conversion rate"
                value={formatConversionRate(data.conversionRate)}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">By stage</p>
                <CountBreakdownTable record={data.byStage} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">By source</p>
                <CountBreakdownTable record={data.bySource} />
              </div>
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
