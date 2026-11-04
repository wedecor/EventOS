'use client';

import { useMemo, useState } from 'react';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { formatMoney } from '@/features/dashboard/lib/format';
import { useMonthlyRevenueQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/shared/components/charts';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { DataTable } from '@/shared/components/data-display/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { MonthlyRevenueSummary } from '@/features/dashboard/schemas/dashboard.schemas';

const DEFAULT_MONTHS = 6;

type MonthRow = MonthlyRevenueSummary['months'][number];

const columns: ColumnDef<MonthRow>[] = [
  { accessorKey: 'month', header: 'Month' },
  {
    id: 'revenue',
    header: 'Revenue',
    cell: ({ row }) => formatMoney(row.original.revenue),
  },
  {
    id: 'vendorExpenses',
    header: 'Vendor expenses',
    cell: ({ row }) => formatMoney(row.original.vendorExpenses),
  },
  {
    id: 'grossMargin',
    header: 'Gross margin',
    cell: ({ row }) => formatMoney(row.original.grossMargin),
  },
];

/**
 * Presentation-only chart: plots amount fields returned by monthly-revenue.
 * Does not compute deltas or cross-endpoint aggregates.
 */
export function MonthlyRevenueSection() {
  const [monthsInput, setMonthsInput] = useState(String(DEFAULT_MONTHS));
  const [months, setMonths] = useState(DEFAULT_MONTHS);
  const query = useMonthlyRevenueQuery(months);
  const points = useMemo(() => query.data?.months ?? [], [query.data?.months]);

  const chartData = useMemo(
    () =>
      points.map((point) => ({
        month: point.month,
        revenue: point.revenue.amount,
        vendorExpenses: point.vendorExpenses.amount,
        grossMargin: point.grossMargin.amount,
        currency: point.revenue.currency,
      })),
    [points],
  );

  const applyMonths = () => {
    const parsed = Number.parseInt(monthsInput, 10);
    if (!Number.isFinite(parsed) || parsed < 1 || parsed > 24) return;
    setMonths(parsed);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="revenue-months"
          >
            Months (API `months`, max 24)
          </label>
          <Input
            id="revenue-months"
            type="number"
            min={1}
            max={24}
            className="w-32"
            value={monthsInput}
            onChange={(e) => setMonthsInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyMonths}>
          Apply
        </Button>
      </div>

      <DashboardWidget
        title="Monthly revenue"
        description="GET /api/v1/dashboards/monthly-revenue — chart uses returned amounts only"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!query.isLoading && !query.isError && points.length === 0}
        emptyTitle="No monthly points"
        emptyDescription="The API returned an empty months array for this window."
        onRetry={() => void query.refetch()}
      >
        <div className="space-y-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="vendorExpenses"
                  name="Vendor expenses"
                  stroke="#0f766e"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  name="Gross margin"
                  stroke="#b45309"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <DataTable columns={columns} data={points} />
        </div>
      </DashboardWidget>
    </div>
  );
}
