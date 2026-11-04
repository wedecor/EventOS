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
 * Customers hub — Phase 1 has no GET /clients list.
 * Create + open-by-id are supported; list/search deferred until the API ships.
 */
export function CustomersHubPage() {
  const pathname = usePathname() ?? '/app/customers/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="clients:read">
      <PageLayout>
        <PageHeader
          title="Customers"
          description="Customer profiles (API resource: clients). List endpoint is not shipped in Phase 1."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Can permission="clients:write">
              <Button asChild>
                <Link href="/app/customers/new/">New customer</Link>
              </Button>
            </Can>
          }
        />
        <PageSection>
          <ContentCard title="Customer list unavailable">
            <EmptyState
              title="No list API in Phase 1"
              description="GET /api/v1/clients is deferred. Create a customer, or open an existing profile by ID below."
            />
            <OpenByIdForm
              id="customer-id"
              label="Customer ID"
              submitLabel="Open customer"
              hrefForId={(id) => `/app/customers/view/?id=${encodeURIComponent(id)}`}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Can permission="clients:write">
                <Button asChild>
                  <Link href="/app/customers/new/">Create customer</Link>
                </Button>
              </Can>
            </div>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
