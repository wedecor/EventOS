'use client';

import Link from 'next/link';
import { DashboardWidget } from '@/features/dashboard/components/dashboard-widget';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { useStaffSummaryQuery } from '@/features/dashboard/hooks/use-dashboard-queries';
import { Button } from '@/shared/components/ui/button';
import { CountBreakdownTable } from './count-breakdown-table';

export function StaffSummarySection() {
  const query = useStaffSummaryQuery();
  const data = query.data;

  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm">
        <Link href="/app/staff/">Open staff</Link>
      </Button>
      <DashboardWidget
        title="Staff summary"
        description="GET /api/v1/dashboards/staff-summary"
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        {data ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <KpiCard
                label="Total assignments"
                value={String(data.totalAssignments)}
              />
              <KpiCard label="On-site leads" value={String(data.onSiteLeadCount)} />
              <KpiCard
                label="Unconfirmed (upcoming)"
                value={String(data.unconfirmedForUpcomingEvents)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Assignments by status
              </p>
              <CountBreakdownTable record={data.byStatus} />
            </div>
          </div>
        ) : null}
      </DashboardWidget>
    </div>
  );
}
