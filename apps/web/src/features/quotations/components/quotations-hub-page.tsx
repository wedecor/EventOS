'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  OpenByIdForm,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';

/**
 * Quotations hub — Phase 1 has no GET /quotations list.
 * Create + open-by-id are supported; list/PDF/line-item read deferred.
 */
export function QuotationsHubPage() {
  const pathname = usePathname() ?? '/app/quotations/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="quotations:read">
      <PageLayout>
        <PageHeader
          title="Quotations"
          description="Quotation headers and lifecycle actions. List, PDF, and line-item read APIs are not shipped in Phase 1."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="quotations:write">
              <Button asChild>
                <Link href="/app/quotations/new/">New quotation</Link>
              </Button>
            </Can>
          }
        />
        <PageSection>
          <ContentCard title="Quotation list unavailable">
            <EmptyState
              title="No list API in Phase 1"
              description="GET /api/v1/quotations is not in the frozen OpenAPI. Create a quotation, or open an existing one by ID below."
            />
            <OpenByIdForm
              id="quotation-id"
              label="Quotation ID"
              submitLabel="Open quotation"
              hrefForId={(id) => `/app/quotations/view/?id=${encodeURIComponent(id)}`}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Can permission="quotations:write">
                <Button asChild>
                  <Link href="/app/quotations/new/">Create quotation</Link>
                </Button>
              </Can>
            </div>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
