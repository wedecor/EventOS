'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import {
  useCustomerBookingsQuery,
  useCustomerCommunicationsQuery,
  useCustomerFinancialQuery,
  useCustomerOverviewQuery,
  useCustomerRelationshipQuery,
  useCustomerTimelineQuery,
} from '../hooks/use-customer-queries';
import {
  formatHealthLabel,
  formatMoney,
  formatWhen,
  type CustomerHealth,
} from '../schemas/customer-intelligence.schemas';

type TabId =
  | 'overview'
  | 'timeline'
  | 'bookings'
  | 'relationship'
  | 'finance'
  | 'communications';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'relationship', label: 'Relationship' },
  { id: 'finance', label: 'Finance' },
  { id: 'communications', label: 'Communications' },
];

const TIMELINE_SOURCES = [
  'lead',
  'follow_up',
  'quotation',
  'booking',
  'communication',
  'payment',
  'financial_document',
  'timeline_entry',
  'reminder',
  'event_milestone',
] as const;

function healthClass(health: CustomerHealth): string {
  switch (health) {
    case 'follow_up_required':
      return 'bg-amber-100 text-amber-900';
    case 'dormant':
      return 'bg-slate-100 text-slate-700';
    case 'returning':
      return 'bg-sky-100 text-sky-900';
    default:
      return 'bg-emerald-100 text-emerald-900';
  }
}

function queryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

export function Customer360Page() {
  const pathname = usePathname() ?? '/app/customers/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'overview';
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'overview',
  );
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const overviewQuery = useCustomerOverviewQuery(id);
  const timelineFilters = useMemo(
    () =>
      selectedSources.length > 0
        ? { sources: selectedSources.join(',') }
        : undefined,
    [selectedSources],
  );
  const timelineQuery = useCustomerTimelineQuery(
    tab === 'timeline' ? id : null,
    timelineFilters,
  );
  const bookingsQuery = useCustomerBookingsQuery(
    tab === 'bookings' || tab === 'overview' ? id : null,
  );
  const relationshipQuery = useCustomerRelationshipQuery(
    tab === 'relationship' || tab === 'overview' ? id : null,
  );
  const financialQuery = useCustomerFinancialQuery(
    tab === 'finance' || tab === 'overview' ? id : null,
  );
  const communicationsQuery = useCustomerCommunicationsQuery(
    tab === 'communications' || tab === 'overview' ? id : null,
  );

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: overviewQuery.data?.displayName ?? 'Customer 360',
  });

  return (
    <RequirePermission permission="clients:read">
      <PageLayout>
        <PageHeader
          title={overviewQuery.data?.displayName ?? 'Customer 360'}
          description="Unified customer timeline and relationship intelligence"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            id ? (
              <div className="flex flex-wrap gap-2">
                {overviewQuery.data ? (
                  <>
                    <Button asChild variant="outline" size="sm">
                      <Link href={overviewQuery.data.deepLinks.calendar}>
                        Calendar
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={overviewQuery.data.deepLinks.communications}>
                        Communications
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={overviewQuery.data.deepLinks.finance}>
                        Finance
                      </Link>
                    </Button>
                  </>
                ) : null}
                <Can permission="clients:write">
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/customers/edit/?id=${encodeURIComponent(id)}`}
                    >
                      Edit
                    </Link>
                  </Button>
                </Can>
              </div>
            ) : null
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="No customer selected"
              description="Open a customer from the hub with ?id=."
            />
          </PageSection>
        ) : overviewQuery.isLoading ? (
          <PageSection>
            <LoadingState label="Loading customer intelligence…" />
          </PageSection>
        ) : overviewQuery.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load customer"
              description={queryErrorMessage(overviewQuery.error)}
            />
          </PageSection>
        ) : overviewQuery.data ? (
          <>
            <PageSection>
              <ContentCard title="Health & profile">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${healthClass(overviewQuery.data.health)}`}
                  >
                    {formatHealthLabel(overviewQuery.data.health)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {overviewQuery.data.type} · {overviewQuery.data.status}
                  </span>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{overviewQuery.data.primaryPhone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{overviewQuery.data.primaryEmail ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">First interaction</dt>
                    <dd>{formatWhen(overviewQuery.data.firstInteractionAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Last interaction</dt>
                    <dd>{formatWhen(overviewQuery.data.lastInteractionAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Total events</dt>
                    <dd>{overviewQuery.data.totalEvents}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Active bookings</dt>
                    <dd>{overviewQuery.data.activeBookings}</dd>
                  </div>
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <div className="mb-4 flex flex-wrap gap-2">
                {TABS.map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    size="sm"
                    variant={tab === item.id ? 'default' : 'outline'}
                    onClick={() => setTab(item.id)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>

              {tab === 'overview' ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ContentCard title="Relationship snapshot">
                    {relationshipQuery.isLoading ? (
                      <LoadingState label="Loading…" />
                    ) : relationshipQuery.data ? (
                      <ul className="space-y-2 text-sm">
                        <li>
                          Repeat customer:{' '}
                          {relationshipQuery.data.repeatCustomer ? 'Yes' : 'No'}
                        </li>
                        <li>
                          Lifetime bookings:{' '}
                          {relationshipQuery.data.lifetimeBookingCount}
                        </li>
                        <li>
                          Preferred channel:{' '}
                          {relationshipQuery.data.preferredCommunicationChannel ??
                            '—'}
                        </li>
                        <li>
                          Preferred event types:{' '}
                          {relationshipQuery.data.preferredEventTypes.join(
                            ', ',
                          ) || '—'}
                        </li>
                      </ul>
                    ) : (
                      <EmptyState title="No relationship data" />
                    )}
                  </ContentCard>
                  <ContentCard title="Financial snapshot">
                    {financialQuery.isLoading ? (
                      <LoadingState label="Loading…" />
                    ) : financialQuery.data ? (
                      <ul className="space-y-2 text-sm">
                        <li>
                          Quoted:{' '}
                          {formatMoney(
                            financialQuery.data.totalQuoted,
                            financialQuery.data.currency,
                          )}
                        </li>
                        <li>
                          Invoiced:{' '}
                          {formatMoney(
                            financialQuery.data.totalInvoiced,
                            financialQuery.data.currency,
                          )}
                        </li>
                        <li>
                          Paid:{' '}
                          {formatMoney(
                            financialQuery.data.totalPaid,
                            financialQuery.data.currency,
                          )}
                        </li>
                        <li>
                          Outstanding:{' '}
                          {formatMoney(
                            financialQuery.data.outstandingBalance,
                            financialQuery.data.currency,
                          )}
                        </li>
                      </ul>
                    ) : (
                      <EmptyState title="No financial data" />
                    )}
                  </ContentCard>
                </div>
              ) : null}

              {tab === 'timeline' ? (
                <ContentCard title="Unified timeline">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {TIMELINE_SOURCES.map((source) => {
                      const active = selectedSources.includes(source);
                      return (
                        <Button
                          key={source}
                          type="button"
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          onClick={() =>
                            setSelectedSources((prev) =>
                              active
                                ? prev.filter((s) => s !== source)
                                : [...prev, source],
                            )
                          }
                        >
                          {source}
                        </Button>
                      );
                    })}
                  </div>
                  {timelineQuery.isLoading ? (
                    <LoadingState label="Loading timeline…" />
                  ) : timelineQuery.isError ? (
                    <ErrorState
                      title="Unable to load timeline"
                      description={queryErrorMessage(timelineQuery.error)}
                    />
                  ) : !timelineQuery.data?.length ? (
                    <EmptyState title="No timeline items" />
                  ) : (
                    <ul className="space-y-3">
                      {timelineQuery.data.map((item) => (
                        <li
                          key={item.id}
                          className="border-b border-border pb-3 last:border-0"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.source}
                                {item.status ? ` · ${item.status}` : ''}
                              </p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              <div>{formatWhen(item.occurredAt)}</div>
                              {item.hrefHint ? (
                                <Link
                                  href={item.hrefHint}
                                  className="text-primary underline-offset-2 hover:underline"
                                >
                                  Open
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ContentCard>
              ) : null}

              {tab === 'bookings' ? (
                <ContentCard title="Booking history">
                  {bookingsQuery.isLoading ? (
                    <LoadingState label="Loading bookings…" />
                  ) : !bookingsQuery.data?.length ? (
                    <EmptyState title="No bookings" />
                  ) : (
                    <ul className="space-y-3">
                      {bookingsQuery.data.map((booking) => (
                        <li
                          key={booking.bookingId}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              B-{booking.bookingNumber}
                              {booking.eventType
                                ? ` · ${booking.eventType}`
                                : ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {booking.eventStartDate ?? '—'} · {booking.status}{' '}
                              · {booking.outcome}
                              {booking.value != null && booking.currency
                                ? ` · ${formatMoney(booking.value, booking.currency)}`
                                : ''}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={booking.hrefWorkspace}>
                                Workspace
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={booking.hrefCalendar}>Calendar</Link>
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </ContentCard>
              ) : null}

              {tab === 'relationship' ? (
                <ContentCard title="Relationship intelligence">
                  {relationshipQuery.isLoading ? (
                    <LoadingState label="Loading…" />
                  ) : relationshipQuery.data ? (
                    <dl className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Repeat</dt>
                        <dd>
                          {relationshipQuery.data.repeatCustomer ? 'Yes' : 'No'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">First booking</dt>
                        <dd>
                          {relationshipQuery.data.firstBookingDate ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Most recent</dt>
                        <dd>
                          {relationshipQuery.data.mostRecentBookingDate ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Lifetime count</dt>
                        <dd>
                          {relationshipQuery.data.lifetimeBookingCount}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Preferred channel
                        </dt>
                        <dd>
                          {relationshipQuery.data
                            .preferredCommunicationChannel ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Preferred event types
                        </dt>
                        <dd>
                          {relationshipQuery.data.preferredEventTypes.join(
                            ', ',
                          ) || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Pending reminders</dt>
                        <dd>
                          {relationshipQuery.data.indicators.hasPendingReminders
                            ? 'Yes'
                            : 'No'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Failed communications
                        </dt>
                        <dd>
                          {relationshipQuery.data.indicators
                            .hasFailedCommunications
                            ? 'Yes'
                            : 'No'}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <EmptyState title="No relationship data" />
                  )}
                </ContentCard>
              ) : null}

              {tab === 'finance' ? (
                <ContentCard title="Financial summary">
                  {financialQuery.isLoading ? (
                    <LoadingState label="Loading…" />
                  ) : financialQuery.data ? (
                    <div className="space-y-4">
                      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div>
                          <dt className="text-muted-foreground">Quoted</dt>
                          <dd>
                            {formatMoney(
                              financialQuery.data.totalQuoted,
                              financialQuery.data.currency,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Invoiced</dt>
                          <dd>
                            {formatMoney(
                              financialQuery.data.totalInvoiced,
                              financialQuery.data.currency,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Paid</dt>
                          <dd>
                            {formatMoney(
                              financialQuery.data.totalPaid,
                              financialQuery.data.currency,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Outstanding</dt>
                          <dd>
                            {formatMoney(
                              financialQuery.data.outstandingBalance,
                              financialQuery.data.currency,
                            )}
                          </dd>
                        </div>
                      </dl>
                      {financialQuery.data.documents.length > 0 ? (
                        <ul className="space-y-2 text-sm">
                          {financialQuery.data.documents.map((doc) => (
                            <li
                              key={doc.id}
                              className="flex justify-between gap-2"
                            >
                              <span>
                                {doc.fileName ?? doc.documentType} ·{' '}
                                {doc.verificationStatus}
                              </span>
                              <Link
                                href={doc.hrefHint}
                                className="text-primary underline-offset-2 hover:underline"
                              >
                                Open
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No financial documents.
                        </p>
                      )}
                    </div>
                  ) : (
                    <EmptyState title="No financial data" />
                  )}
                </ContentCard>
              ) : null}

              {tab === 'communications' ? (
                <ContentCard title="Communication intelligence">
                  {communicationsQuery.isLoading ? (
                    <LoadingState label="Loading…" />
                  ) : communicationsQuery.data ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {communicationsQuery.data.total} messages ·{' '}
                        {communicationsQuery.data.failed} failed ·{' '}
                        {communicationsQuery.data.pendingReminders} pending
                        reminders ({communicationsQuery.data.overdueReminders}{' '}
                        overdue)
                      </p>
                      {communicationsQuery.data.channelUsage.length > 0 ? (
                        <p className="text-sm">
                          Channels:{' '}
                          {communicationsQuery.data.channelUsage
                            .map((c) => `${c.channel} (${c.count})`)
                            .join(', ')}
                        </p>
                      ) : null}
                      <ul className="space-y-2">
                        {communicationsQuery.data.recent.map((item) => (
                          <li
                            key={item.id}
                            className="flex justify-between gap-2 border-b border-border pb-2 text-sm last:border-0"
                          >
                            <span>
                              {item.subject ?? item.channel} · {item.status}
                            </span>
                            <Link
                              href={item.hrefHint}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              Open
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <EmptyState title="No communications" />
                  )}
                </ContentCard>
              ) : null}
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
