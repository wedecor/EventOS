'use client';

import { useState } from 'react';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import {
  formatConversionRate,
  formatMoney,
} from '@/features/dashboard/lib/format';
import { useAnalyticsDashboardQuery } from '../hooks/use-analytics-queries';
import type { AnalyticsPeriodParams } from '../schemas/analytics.schemas';
import { DateRangeFilter } from './date-range-filter';

type FounderSectionProps = {
  enabled: boolean;
};

export function FounderSection({ enabled }: FounderSectionProps) {
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [params, setParams] = useState<AnalyticsPeriodParams>({});
  const query = useAnalyticsDashboardQuery(params, enabled);
  const data = query.data;

  return (
    <div className="space-y-4">
      <DateRangeFilter
        idPrefix="founder"
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
        title="Founder dashboard"
        description="GET /api/v1/analytics/dashboard"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total revenue" value={formatMoney(data.totalRevenue)} />
              <KpiCard
                label="Outstanding"
                value={formatMoney(data.outstandingPayments)}
              />
              <KpiCard
                label="Monthly revenue"
                value={formatMoney(data.monthlyRevenue)}
              />
              <KpiCard
                label="Monthly profit"
                value={formatMoney(data.monthlyProfit)}
              />
              <KpiCard
                label="Monthly expenses"
                value={formatMoney(data.monthlyExpenses)}
              />
              <KpiCard label="Active bookings" value={String(data.activeBookings)} />
              <KpiCard label="Upcoming events" value={String(data.upcomingEvents)} />
              <KpiCard
                label="Lead conversion"
                value={formatConversionRate(data.leadConversionRate)}
              />
              <KpiCard
                label="Customer retention"
                value={formatConversionRate(data.customerRetentionRate)}
              />
              <KpiCard
                label="Staff utilisation"
                value={formatConversionRate(data.staffUtilisationRate)}
              />
              <KpiCard
                label="Vendor completion"
                value={formatConversionRate(data.vendorCompletionRate)}
              />
              <KpiCard
                label="Inventory utilisation"
                value={formatConversionRate(data.inventoryUtilisationRate)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <KpiCard label="Leads" value={String(data.counts.leads)} />
              <KpiCard label="Customers" value={String(data.counts.customers)} />
              <KpiCard label="Bookings" value={String(data.counts.bookings)} />
              <KpiCard
                label="Pending reminders"
                value={String(data.counts.pendingReminders)}
              />
              <KpiCard
                label="Pending procurements"
                value={String(data.counts.pendingProcurements)}
              />
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
