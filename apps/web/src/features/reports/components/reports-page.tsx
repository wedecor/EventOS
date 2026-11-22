'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import {
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { FinanceSummarySection } from './finance-summary-section';
import { FounderRangeSection } from './founder-range-section';
import { InventorySummarySection } from './inventory-summary-section';
import { SalesSummarySection } from './sales-summary-section';
import { StaffSummarySection } from './staff-summary-section';

/** Lazy-load Recharts-backed section to keep the Reports route lighter. */
const MonthlyRevenueSection = dynamic(
  () =>
    import('./monthly-revenue-section').then((m) => ({
      default: m.MonthlyRevenueSection,
    })),
  {
    ssr: false,
    loading: () => <LoadingState label="Loading revenue chart…" />,
  },
);

/**
 * F1-14 Option 1 — read-only Reports using dashboard endpoints not consumed by F1-04,
 * plus optional founder date range and monthly-revenue chart (presentation only).
 */
export function ReportsPage() {
  const pathname = usePathname() ?? '/app/reports/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="dashboards:read">
      <PageLayout>
        <PageHeader
          title="Reports"
          description="Deeper read-only summaries from frozen /api/v1/dashboards/* endpoints. No exports or client-side analytics."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />

        <PageSection>
          <SalesSummarySection />
        </PageSection>

        <PageSection>
          <StaffSummarySection />
        </PageSection>

        <PageSection>
          <InventorySummarySection />
        </PageSection>

        <PageSection>
          <FinanceSummarySection />
        </PageSection>

        <PageSection>
          <MonthlyRevenueSection />
        </PageSection>

        <PageSection>
          <FounderRangeSection />
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
