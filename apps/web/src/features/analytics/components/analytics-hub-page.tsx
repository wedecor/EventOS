'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { ExportSection } from './export-section';
import { FinanceSection } from './finance-section';
import { FounderSection } from './founder-section';
import { OperationsSection } from './operations-section';
import { SalesSection } from './sales-section';
import { TrendsSection } from './trends-section';

type AnalyticsTab =
  | 'founder'
  | 'sales'
  | 'finance'
  | 'operations'
  | 'trends'
  | 'export';

const TABS: { id: AnalyticsTab; label: string }[] = [
  { id: 'founder', label: 'Founder' },
  { id: 'sales', label: 'Sales' },
  { id: 'finance', label: 'Finance' },
  { id: 'operations', label: 'Operations' },
  { id: 'trends', label: 'Trends' },
  { id: 'export', label: 'Export' },
];

/**
 * P2-12 Business Intelligence hub — read-only analytics from `/api/v1/analytics/*`.
 * Phase-1 `/app/dashboard` and `/app/reports` remain on frozen dashboards endpoints.
 */
export function AnalyticsHubPage() {
  const pathname = usePathname() ?? '/app/analytics/';
  const crumbs = buildBreadcrumbs(pathname);
  const [tab, setTab] = useState<AnalyticsTab>('founder');

  return (
    <RequirePermission permission="analytics:read">
      <PageLayout>
        <PageHeader
          title="Analytics"
          description="Business intelligence across founder KPIs, sales, finance, operations, trends, and exports."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />

        <PageSection>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Analytics sections">
            {TABS.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                role="tab"
                aria-selected={tab === item.id}
                variant={tab === item.id ? 'default' : 'outline'}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </PageSection>

        <PageSection>
          {tab === 'founder' ? <FounderSection enabled={tab === 'founder'} /> : null}
          {tab === 'sales' ? <SalesSection enabled={tab === 'sales'} /> : null}
          {tab === 'finance' ? <FinanceSection enabled={tab === 'finance'} /> : null}
          {tab === 'operations' ? (
            <OperationsSection enabled={tab === 'operations'} />
          ) : null}
          {tab === 'trends' ? <TrendsSection enabled={tab === 'trends'} /> : null}
          {tab === 'export' ? <ExportSection /> : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
