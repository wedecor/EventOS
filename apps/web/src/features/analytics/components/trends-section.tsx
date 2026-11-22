'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { DataTable } from '@/shared/components/data-display/data-table';
import { Button } from '@/shared/components/ui/button';
import { useAnalyticsTrendsQuery } from '../hooks/use-analytics-queries';
import type {
  AnalyticsGranularity,
  AnalyticsPeriodParams,
} from '../schemas/analytics.schemas';
import { DateRangeFilter } from './date-range-filter';

type TrendsSectionProps = {
  enabled: boolean;
};

type TrendPointRow = {
  period: string;
  revenue: number;
  expenses: number;
  leads: number;
  bookings: number;
  customers: number;
};

const GRANULARITIES: AnalyticsGranularity[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

const trendColumns: ColumnDef<TrendPointRow>[] = [
  { accessorKey: 'period', header: 'Period' },
  { accessorKey: 'revenue', header: 'Revenue' },
  { accessorKey: 'expenses', header: 'Expenses' },
  { accessorKey: 'leads', header: 'Leads' },
  { accessorKey: 'bookings', header: 'Bookings' },
  { accessorKey: 'customers', header: 'Customers' },
];

export function TrendsSection({ enabled }: TrendsSectionProps) {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [granularity, setGranularity] =
    useState<AnalyticsGranularity>('monthly');
  const [params, setParams] = useState<
    AnalyticsPeriodParams & { granularity?: AnalyticsGranularity }
  >({ granularity: 'monthly' });

  const query = useAnalyticsTrendsQuery(params, enabled);
  const data = query.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <DateRangeFilter
          idPrefix="trends"
          fromInput={fromInput}
          toInput={toInput}
          onFromChange={setFromInput}
          onToChange={setToInput}
          onApply={() =>
            setParams({
              from: fromInput.trim() || undefined,
              to: toInput.trim() || undefined,
              granularity,
            })
          }
          onClear={() => {
            setFromInput('');
            setToInput('');
            setParams({ granularity });
          }}
        />
        <div className="space-y-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="trends-granularity"
          >
            Granularity
          </label>
          <select
            id="trends-granularity"
            className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
            value={granularity}
            onChange={(e) => {
              const next = e.target.value as AnalyticsGranularity;
              setGranularity(next);
              setParams((prev) => ({ ...prev, granularity: next }));
            }}
          >
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setParams({
              from: fromInput.trim() || undefined,
              to: toInput.trim() || undefined,
              granularity,
            })
          }
        >
          Refresh
        </Button>
      </div>

      <DashboardWidget
        title="Trend reports"
        description={
          data
            ? `GET /api/v1/analytics/trends · granularity ${data.granularity}`
            : 'GET /api/v1/analytics/trends'
        }
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!query.isLoading && !query.isError && data?.points.length === 0}
        emptyTitle="No trend points"
        emptyDescription="Try a wider date range or different granularity."
        onRetry={() => void query.refetch()}
      >
        {data && data.points.length > 0 ? (
          <DataTable columns={trendColumns} data={data.points} />
        ) : null}
      </DashboardWidget>
    </div>
  );
}
