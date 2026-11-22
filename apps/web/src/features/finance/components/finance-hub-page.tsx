'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
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
 * Finance hub — Phase 1 has no global payment/invoice/expense lists.
 * Open booking financial panels by booking id.
 */
export function FinanceHubPage() {
  const pathname = usePathname() ?? '/app/finance/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission
      anyOf={[
        'payments:read',
        'invoices:read',
        'expenses:read',
        'profitability:read',
      ]}
    >
      <PageLayout>
        <PageHeader
          title="Finance"
          description="Booking-scoped payments, invoices, expenses, and profitability. Global finance lists are not in the frozen API."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Open booking finance">
            <EmptyState
              title="No global finance list in Phase 1"
              description="Use a booking id below, open Finance from a booking detail page, or follow dashboard pending-payments into a booking."
            />
            <OpenByIdForm
              id="finance-booking-id"
              label="Booking ID"
              submitLabel="Open finance"
              hrefForId={(id) =>
                `/app/finance/booking/?id=${encodeURIComponent(id)}`
              }
            />
            <div className="mt-3">
              <Button asChild type="button" variant="outline">
                <Link href="/app/bookings/">Bookings hub</Link>
              </Button>
            </div>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
