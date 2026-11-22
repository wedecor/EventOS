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
import { useCommunicationsQuery } from '../hooks/use-communication-queries';
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_STATUSES,
  formatCommunicationLabel,
  formatWhen,
  type CommunicationChannel,
  type CommunicationRecord,
  type CommunicationStatus,
} from '../schemas/communication.schemas';

function CommunicationRow({ record }: { record: CommunicationRecord }) {
  return (
    <li>
      <Link
        href={`/app/communications/view/?id=${encodeURIComponent(record.id)}`}
        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm hover:bg-muted/40"
      >
        <div>
          <p className="font-medium">
            {formatCommunicationLabel(record.channel)} ·{' '}
            {formatCommunicationLabel(record.status)}
          </p>
          <p className="text-xs text-muted-foreground">
            {record.subject ?? 'No subject'}
            {record.bookingId ? ` · Booking ${record.bookingId.slice(0, 8)}` : ''}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          {formatWhen(record.occurredAt)}
        </p>
      </Link>
    </li>
  );
}

export function CommunicationsDashboardPage() {
  const pathname = usePathname() ?? '/app/communications/';
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: bookingId ? 'Booking communications' : 'Communications',
  });
  const query = useCommunicationsQuery(bookingId);
  const [statusFilter, setStatusFilter] = useState<CommunicationStatus | ''>(
    '',
  );
  const [channelFilter, setChannelFilter] = useState<
    CommunicationChannel | ''
  >('');

  const filtered = useMemo(() => {
    const rows = query.data ?? [];
    return rows.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (channelFilter && row.channel !== channelFilter) return false;
      return true;
    });
  }, [query.data, statusFilter, channelFilter]);

  return (
    <RequirePermission
      anyOf={[
        'communications:read',
        'reminders:read',
        'communication-templates:read',
      ]}
    >
      <PageLayout>
        <PageHeader
          title="Communication Center"
          description="Outbound and inbound records, templates, and follow-up reminders."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              <Can permission="communication-templates:read">
                <Button asChild variant="outline">
                  <Link href="/app/communications/templates/">Templates</Link>
                </Button>
              </Can>
              <Can permission="reminders:read">
                <Button asChild variant="outline">
                  <Link
                    href={
                      bookingId
                        ? `/app/communications/reminders/?bookingId=${encodeURIComponent(bookingId)}`
                        : '/app/communications/reminders/'
                    }
                  >
                    Reminders
                  </Link>
                </Button>
              </Can>
              <Can permission="communications:write">
                <Button asChild>
                  <Link
                    href={
                      bookingId
                        ? `/app/communications/new/?bookingId=${encodeURIComponent(bookingId)}`
                        : '/app/communications/new/'
                    }
                  >
                    New communication
                  </Link>
                </Button>
              </Can>
            </div>
          }
        />

        <PageSection>
          <ContentCard
            title="Filters"
            description={
              bookingId
                ? `Scoped to booking ${bookingId}`
                : 'Filter by status or channel'
            }
          >
            <div className="flex flex-wrap gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-xs text-muted-foreground">Status</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as CommunicationStatus | '')
                  }
                >
                  <option value="">All statuses</option>
                  {COMMUNICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatCommunicationLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-xs text-muted-foreground">Channel</span>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={channelFilter}
                  onChange={(e) =>
                    setChannelFilter(
                      e.target.value as CommunicationChannel | '',
                    )
                  }
                >
                  <option value="">All channels</option>
                  {COMMUNICATION_CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {formatCommunicationLabel(channel)}
                    </option>
                  ))}
                </select>
              </label>
              {bookingId ? (
                <Button asChild variant="outline" className="self-end">
                  <Link href="/app/communications/">Clear booking filter</Link>
                </Button>
              ) : null}
            </div>
          </ContentCard>
        </PageSection>

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={4} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load communications"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading && !query.isError && filtered.length === 0 ? (
            <EmptyState
              title="No communications"
              description="Create a record or adjust filters."
            />
          ) : null}
          {!query.isLoading && !query.isError && filtered.length > 0 ? (
            <ContentCard
              title="Communications"
              description={`${filtered.length} record${filtered.length === 1 ? '' : 's'}`}
            >
              <ul className="space-y-2">
                {filtered.map((record) => (
                  <CommunicationRow key={record.id} record={record} />
                ))}
              </ul>
            </ContentCard>
          ) : null}
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
