'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import {
  formatConversionRate,
  formatMoney,
} from '@/features/dashboard/lib/format';
import { useFounderKpisQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
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

/**
 * Optional founder date range for weekly review (EP1-KPI-006 UX).
 * Uses GET /dashboards/founder?from&to only — no target tracking.
 */
export function FounderRangeSection() {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const query = useFounderKpisQuery({ from, to });
  const data = query.data;

  const sources: LeadSourceRow[] = data
    ? Object.entries(data.kpis.leadSourcePerformance).map(([source, entry]) => ({
        source,
        ...entry,
      }))
    : [];

  const applyRange = () => {
    setFrom(fromInput.trim() || undefined);
    setTo(toInput.trim() || undefined);
  };

  const clearRange = () => {
    setFromInput('');
    setToInput('');
    setFrom(undefined);
    setTo(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="founder-from">
            From (YYYY-MM-DD)
          </label>
          <Input
            id="founder-from"
            type="date"
            className="w-44"
            value={fromInput}
            onChange={(e) => setFromInput(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="founder-to">
            To (YYYY-MM-DD)
          </label>
          <Input
            id="founder-to"
            type="date"
            className="w-44"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={applyRange}>
          Apply range
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={clearRange}>
          Clear (API default week)
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/dashboard/">Dashboard landing</Link>
        </Button>
      </div>

      <DashboardWidget
        title="Founder KPIs (optional range)"
        description={
          data
            ? `Week of ${data.weekOf} — GET /api/v1/dashboards/founder`
            : 'Optional from/to filter; omit for backend default trailing week'
        }
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Enquiries" value={String(data.kpis.enquiries)} />
              <KpiCard
                label="Conversion rate"
                value={formatConversionRate(data.kpis.conversionRate)}
              />
              <KpiCard
                label="Events completed"
                value={String(data.kpis.eventsCompleted)}
              />
              <KpiCard
                label="Gross margin"
                value={formatMoney(data.kpis.grossMargin)}
              />
            </div>
            {sources.length > 0 ? (
              <DataTable columns={leadSourceColumns} data={sources} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No lead sources in this period.
              </p>
            )}
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
