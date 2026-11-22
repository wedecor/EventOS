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
 * Events hub — workspace is booking-scoped (no separate event list API).
 * Gated on workspace:read to match the workspace detail page.
 */
export function EventsHubPage() {
  const pathname = usePathname() ?? '/app/events/';
  const crumbs = buildBreadcrumbs(pathname);

  return (
    <RequirePermission permission="workspace:read">
      <PageLayout>
        <PageHeader
          title="Events"
          description="Event workspace is booking-scoped (GET/POST /api/v1/bookings/:id/workspace). Open by booking ID."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/bookings/">Bookings hub</Link>
            </Button>
          }
        />
        <PageSection>
          <ContentCard title="Open event workspace">
            <EmptyState
              title="No event list API"
              description="Use a booking UUID from quotation approve (eventId), Bookings hub, or Dashboard upcoming events."
            />
            <OpenByIdForm
              id="event-booking-id"
              label="Booking ID"
              submitLabel="Open workspace"
              hrefForId={(id) =>
                `/app/events/workspace/?id=${encodeURIComponent(id)}`
              }
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
