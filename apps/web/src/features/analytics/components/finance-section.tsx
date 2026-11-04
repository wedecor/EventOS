'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { formatMoney } from '@/features/dashboard/lib/format';
import { DataTable } from '@/shared/components/data-display/data-table';
import { useAnalyticsFinanceQuery } from '../hooks/use-analytics-queries';
import type { AnalyticsPeriodParams } from '../schemas/analytics.schemas';
import { CountBreakdownTable } from './count-breakdown-table';
import { DateRangeFilter } from './date-range-filter';

type FinanceSectionProps = {
  enabled: boolean;
};

type TrendRow = { month: string; collected: number; expenses: number };

const trendColumns: ColumnDef<TrendRow>[] = [
  { accessorKey: 'month', header: 'Month' },
  { accessorKey: 'collected', header: 'Collected' },
  { accessorKey: 'expenses', header: 'Expenses' },
];

export function FinanceSection({ enabled }: FinanceSectionProps) {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [params, setParams] = useState<AnalyticsPeriodParams>({});
  const query = useAnalyticsFinanceQuery(params, enabled);
  const data = query.data;

  return (
    <div className="space-y-4">
      <DateRangeFilter
        idPrefix="finance"
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
        title="Finance analytics"
        description="GET /api/v1/analytics/finance"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard label="Revenue" value={formatMoney(data.revenue)} />
              <KpiCard label="Expenses" value={formatMoney(data.expenses)} />
              <KpiCard label="Gross profit" value={formatMoney(data.grossProfit)} />
              <KpiCard
                label="Outstanding receivables"
                value={formatMoney(data.outstandingReceivables)}
              />
              <KpiCard
                label="Procurement spend"
                value={formatMoney(data.procurementSpend)}
              />
              <KpiCard
                label="Cost variance"
                value={String(data.costVariance.variance)}
                hint={`Est. ${data.costVariance.estimated} · Act. ${data.costVariance.actual}`}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Invoices by status
              </p>
              <CountBreakdownTable record={data.invoicesByStatus} />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Payment collection trend
              </p>
              {data.paymentCollectionTrend.length > 0 ? (
                <DataTable
                  columns={trendColumns}
                  data={data.paymentCollectionTrend}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No trend rows.</p>
              )}
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
