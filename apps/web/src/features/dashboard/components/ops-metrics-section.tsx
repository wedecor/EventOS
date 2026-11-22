'use client';

import { Button } from '@/shared/components/ui/button';
import { ContentCard } from '@/shared/components/page';
import { KpiCard } from './kpi-card';
import {
  useBookingSummaryQuery,
  useEventExecutionQuery,
  useLeadPipelineQuery,
  useOperationalOverviewQuery,
  usePendingPaymentsQuery,
  useVendorSummaryQuery,
} from '../hooks/use-dashboard-queries';
import { formatMoney } from '../lib/format';

/**
 * Operational metric cards — labels map 1:1 to frozen dashboard fields (option 3 hybrid).
 * Each KPI renders independently so one failing endpoint does not blank the section.
 */
export function OpsMetricsSection() {
  const pipeline = useLeadPipelineQuery();
  const bookings = useBookingSummaryQuery();
  const execution = useEventExecutionQuery();
  const payments = usePendingPaymentsQuery();
  const vendors = useVendorSummaryQuery();
  const overview = useOperationalOverviewQuery();

  const queries = [pipeline, bookings, execution, payments, vendors, overview];
  const anyData = queries.some((q) => q.data != null);
  const allLoading = queries.every((q) => q.isLoading);
  const anyError = queries.some((q) => q.isError);

  const retryAll = () => {
    void pipeline.refetch();
    void bookings.refetch();
    void execution.refetch();
    void payments.refetch();
    void vendors.refetch();
    void overview.refetch();
  };

  const valueOrDash = (
    loading: boolean,
    errored: boolean,
    value: string | undefined,
  ): string => {
    if (value != null) return value;
    if (loading) return '…';
    if (errored) return '—';
    return '—';
  };

  return (
    <ContentCard
      title="Operations snapshot"
      description="Read models from lead-pipeline, booking, execution, payments, vendor, and operational-overview APIs"
    >
      {anyError ? (
        <div className="mb-3">
          <Button type="button" variant="outline" size="sm" onClick={retryAll}>
            Retry failed
          </Button>
        </div>
      ) : null}
      {allLoading && !anyData ? (
        <p className="text-sm text-muted-foreground">Loading operations metrics…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Active leads"
            value={valueOrDash(
              pipeline.isLoading,
              pipeline.isError,
              pipeline.data ? String(pipeline.data.activeLeads) : undefined,
            )}
            hint={
              pipeline.isError
                ? 'lead-pipeline failed'
                : 'lead-pipeline.activeLeads'
            }
          />
          <KpiCard
            label="Upcoming events"
            value={valueOrDash(
              overview.isLoading && bookings.isLoading,
              overview.isError && bookings.isError,
              overview.data
                ? String(overview.data.upcomingEventsCount)
                : bookings.data
                  ? String(bookings.data.upcomingCount)
                  : undefined,
            )}
            hint="operational-overview.upcomingEventsCount"
          />
          <KpiCard
            label="Events needing attention"
            value={valueOrDash(
              execution.isLoading,
              execution.isError,
              execution.data
                ? String(execution.data.needsAttentionCount)
                : undefined,
            )}
            hint={
              execution.isError
                ? 'event-execution-summary failed'
                : 'event-execution-summary.needsAttentionCount'
            }
          />
          <KpiCard
            label="Outstanding payments"
            value={valueOrDash(
              payments.isLoading && overview.isLoading,
              payments.isError && overview.isError,
              payments.data
                ? formatMoney(payments.data.totalDueAmount)
                : overview.data
                  ? formatMoney(overview.data.pendingPaymentsAmount)
                  : undefined,
            )}
            hint={
              payments.data
                ? `${payments.data.items.length} booking(s) with amount due`
                : payments.isError
                  ? 'pending-payments failed'
                  : 'pending-payments.totalDueAmount'
            }
          />
          <KpiCard
            label="Cost variance flagged"
            value={valueOrDash(
              vendors.isLoading && overview.isLoading,
              vendors.isError && overview.isError,
              vendors.data
                ? String(vendors.data.procurementLines.costVarianceFlaggedCount)
                : overview.data
                  ? String(overview.data.costVarianceFlaggedCount)
                  : undefined,
            )}
            hint="vendor-summary.procurementLines.costVarianceFlaggedCount"
          />
          <KpiCard
            label="Active events"
            value={valueOrDash(
              execution.isLoading,
              execution.isError,
              execution.data
                ? String(execution.data.activeEventCount)
                : undefined,
            )}
            hint="event-execution-summary.activeEventCount"
          />
        </div>
      )}
    </ContentCard>
  );
}
