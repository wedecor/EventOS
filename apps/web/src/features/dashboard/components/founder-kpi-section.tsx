'use client';

import { KpiCard } from './kpi-card';
import { DashboardWidget } from './dashboard-widget';
import { useFounderKpisQuery } from '../hooks/use-dashboard-queries';
import { formatConversionRate, formatMoney } from '../lib/format';
import { DataTable } from '@/shared/components/data-display/data-table';
import type { ColumnDef } from '@tanstack/react-table';

type LeadSourceRow = {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
};

const leadSourceColumns: ColumnDef<LeadSourceRow>[] = [
  { accessorKey: 'source', header: 'Source' },
  { accessorKey: 'totalLeads', header: 'Leads' },
  { accessorKey: 'convertedLeads', header: 'Converted' },
  {
    accessorKey: 'conversionRate',
    header: 'Conversion',
    cell: ({ row }) => formatConversionRate(row.original.conversionRate),
  },
];

/** EP1-KPI-001–005 founder weekly review surface. */
export function FounderKpiSection() {
  const query = useFounderKpisQuery();
  const data = query.data;
  const sources: LeadSourceRow[] = data
    ? Object.entries(data.kpis.leadSourcePerformance).map(([source, entry]) => ({
        source,
        ...entry,
      }))
    : [];

  return (
    <div className="space-y-4">
      <DashboardWidget
        title="Founder KPIs"
        description={
          data
            ? `Week of ${data.weekOf} (EP1-KPI-001–005)`
            : 'Weekly founder review metrics from the frozen dashboard API'
        }
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Enquiries" value={String(data.kpis.enquiries)} hint="EP1-KPI-001" />
            <KpiCard
              label="Conversion rate"
              value={formatConversionRate(data.kpis.conversionRate)}
              hint="EP1-KPI-002"
            />
            <KpiCard
              label="Events completed"
              value={String(data.kpis.eventsCompleted)}
              hint="EP1-KPI-003"
            />
            <KpiCard
              label="Gross margin"
              value={formatMoney(data.kpis.grossMargin)}
              hint="EP1-KPI-004"
            />
          </div>
        ) : null}
      </DashboardWidget>

      <DashboardWidget
        title="Lead source performance"
        description="EP1-KPI-005 / EP1-MKT-001"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        isEmpty={!query.isLoading && !query.isError && sources.length === 0}
        emptyTitle="No lead sources in period"
        emptyDescription="Lead source breakdown will appear when enquiries exist for the review window."
        onRetry={() => void query.refetch()}
      >
        <DataTable columns={leadSourceColumns} data={sources} />
      </DashboardWidget>
    </div>
  );
}
