'use client';

import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { FounderKpiSection } from './founder-kpi-section';
import { OpsMetricsSection } from './ops-metrics-section';
import { UpcomingEventsSection } from './upcoming-events-section';
import { QuickActionsSection } from './quick-actions-section';

export function DashboardPage() {
  const pathname = usePathname() ?? '/app/dashboard/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="dashboards:read">
      <PageLayout>
        <PageHeader
          title="Dashboard"
          description="Founder KPIs and operational read models from the frozen Phase 1 dashboard APIs."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />

        <PageSection>
          <QuickActionsSection />
        </PageSection>

        <PageSection>
          <FounderKpiSection />
        </PageSection>

        <PageSection>
          <OpsMetricsSection />
        </PageSection>

        <PageSection>
          <UpcomingEventsSection />
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
