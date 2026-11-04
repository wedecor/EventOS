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
 * Bookings hub — Phase 1 has no GET /bookings list and no POST create.
 * Bookings are created when an approved quotation converts (advance confirmed).
 */
export function BookingsHubPage() {
  const pathname = usePathname() ?? '/app/bookings/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="bookings:read">
      <PageLayout>
        <PageHeader
          title="Bookings"
          description="Event hub records (API resource: bookings). List and create are not shipped — bookings appear after quotation approval with confirmed advance."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Booking list unavailable">
            <EmptyState
              title="No list or create API in Phase 1"
              description="GET /api/v1/bookings and POST /bookings are not in the frozen OpenAPI. Open by ID below, use Dashboard upcoming events, or follow a quotation approve that returns an event id."
            />
            <OpenByIdForm
              id="booking-id"
              label="Booking ID"
              submitLabel="Open booking"
              hrefForId={(id) => `/app/bookings/view/?id=${encodeURIComponent(id)}`}
            />
            <div className="mt-3">
              <Button asChild type="button" variant="outline">
                <Link href="/app/">Home</Link>
              </Button>
            </div>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
