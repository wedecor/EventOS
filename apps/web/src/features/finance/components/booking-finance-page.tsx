'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
import { useBookingQuery } from '@/features/bookings/hooks/use-booking-queries';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  EmptyState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { ExpensesPanel } from './expenses-panel';
import { DocumentsPanel } from './documents-panel';
import { InvoicesPanel } from './invoices-panel';
import { PaymentsPanel } from './payments-panel';
import { ProfitabilityPanel } from './profitability-panel';

/**
 * Booking financial panels — payments, invoices, expenses, profitability, documents.
 */
export function BookingFinancePage() {
  const pathname = usePathname() ?? '/app/finance/booking/';
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const bookingQuery = useBookingQuery(bookingId);

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: bookingId ? 'Booking finance' : 'Finance',
  });

  return (
    <RequirePermission
      anyOf={[
        'payments:read',
        'invoices:read',
        'expenses:read',
        'profitability:read',
        'documents:read',
      ]}
    >
      <PageLayout>
        <PageHeader
          title="Booking finance"
          description="Payments, invoices, expenses, and profitability for one booking."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {bookingId ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/bookings/view/?id=${encodeURIComponent(bookingId)}`}
                  >
                    Booking
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/finance/">Finance hub</Link>
              </Button>
            </div>
          }
        />

        {!bookingId ? (
          <PageSection>
            <EmptyState
              title="Missing booking id"
              description="Open finance with ?id=<booking-uuid>."
            />
          </PageSection>
        ) : null}

        {bookingId ? (
          <>
            <PageSection>
              <p className="text-sm text-muted-foreground">
                Booking{' '}
                <span className="font-mono text-xs">{bookingId}</span>
                {bookingQuery.data?.customerId ? (
                  <>
                    {' '}
                    · Customer{' '}
                    <Link
                      className="text-primary underline-offset-2 hover:underline"
                      href={`/app/customers/view/?id=${encodeURIComponent(bookingQuery.data.customerId)}`}
                    >
                      {bookingQuery.data.customerId}
                    </Link>
                  </>
                ) : null}
              </p>
            </PageSection>

            <Can permission="profitability:read">
              <PageSection>
                <ProfitabilityPanel bookingId={bookingId} />
              </PageSection>
            </Can>

            <Can permission="payments:read">
              <PageSection>
                <PaymentsPanel bookingId={bookingId} />
              </PageSection>
            </Can>

            <Can permission="invoices:read">
              <PageSection>
                <InvoicesPanel
                  bookingId={bookingId}
                  customerId={bookingQuery.data?.customerId}
                />
              </PageSection>
            </Can>

            <Can permission="expenses:read">
              <PageSection>
                <ExpensesPanel bookingId={bookingId} />
              </PageSection>
            </Can>

            <Can permission="documents:read">
              <PageSection>
                <DocumentsPanel bookingId={bookingId} />
              </PageSection>
            </Can>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
