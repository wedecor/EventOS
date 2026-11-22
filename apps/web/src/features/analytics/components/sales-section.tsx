'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import {
  formatConversionRate,
  formatMoney,
} from '@/features/dashboard/lib/format';
import { DataTable } from '@/shared/components/data-display/data-table';
import { useAnalyticsSalesQuery } from '../hooks/use-analytics-queries';
import type { AnalyticsPeriodParams } from '../schemas/analytics.schemas';
import { CountBreakdownTable } from './count-breakdown-table';
import { DateRangeFilter } from './date-range-filter';

type SalesSectionProps = {
  enabled: boolean;
};

type EventTypeRow = { eventType: string; revenue: number };
type MonthRow = { month: string; revenue: number };

const eventTypeColumns: ColumnDef<EventTypeRow>[] = [
  { accessorKey: 'eventType', header: 'Event type' },
  { accessorKey: 'revenue', header: 'Revenue' },
];

const monthColumns: ColumnDef<MonthRow>[] = [
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'revenue', header: 'Revenue' },
];

export function SalesSection({ enabled }: SalesSectionProps) {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [params, setParams] = useState<AnalyticsPeriodParams>({});
  const query = useAnalyticsSalesQuery(params, enabled);
  const data = query.data;

  return (
    <div className="space-y-4">
      <DateRangeFilter
        idPrefix="sales"
        fromInput={fromInput}
        toInput={toInput}
        onFromChange={setFromInput}
        onToChange={setToInput}
        onApply={() =>
          setParams({
            from: fromInput.trim() || undefined,
            to: toInput.trim() || undefined,
          })
        }
        onClear={() => {
          setFromInput('');
          setToInput('');
          setParams({});
        }}
      />

      <DashboardWidget
        title="Sales analytics"
        description="GET /api/v1/analytics/sales"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Leads created" value={String(data.leadsCreated)} />
              <KpiCard label="Leads converted" value={String(data.leadsConverted)} />
              <KpiCard
                label="Conversion rate"
                value={formatConversionRate(data.conversionRate)}
              />
              <KpiCard label="Lost leads" value={String(data.lostLeads)} />
              <KpiCard
                label="Quote acceptance"
                value={formatConversionRate(data.quoteAcceptanceRate)}
              />
              <KpiCard
                label="Avg booking value"
                value={formatMoney(data.averageBookingValue)}
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  By stage
                </p>
                <CountBreakdownTable record={data.byStage} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  By source
                </p>
                <CountBreakdownTable record={data.bySource} />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Revenue by event type
                </p>
                {data.revenueByEventType.length > 0 ? (
                  <DataTable
                    columns={eventTypeColumns}
                    data={data.revenueByEventType}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No rows.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Revenue by month
                </p>
                {data.revenueByMonth.length > 0 ? (
                  <DataTable columns={monthColumns} data={data.revenueByMonth} />
                ) : (
                  <p className="text-sm text-muted-foreground">No rows.</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
