'use client';

import Link from 'next/link';
import { ContentCard } from '@/shared/components/page';

type CommunicationsProgress = {
  total: number;
  failed: number;
  pendingReminders: number;
  overdueReminders: number;
  outstandingActions: number;
};

function DetailField({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function CommunicationsSummaryCard({
  bookingId,
  progress,
}: {
  bookingId: string;
  progress?: CommunicationsProgress | null;
}) {
  return (
    <ContentCard title="Communication">
      {progress ? (
        <dl className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <DetailField label="Total" value={progress.total} />
          <DetailField label="Failed" value={progress.failed} />
          <DetailField
            label="Pending reminders"
            value={progress.pendingReminders}
          />
          <DetailField
            label="Overdue reminders"
            value={progress.overdueReminders}
          />
          <DetailField
            label="Outstanding actions"
            value={progress.outstandingActions}
          />
        </dl>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          No communication progress yet for this event.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        <Link
          className="underline"
          href={`/app/communications/?bookingId=${encodeURIComponent(bookingId)}`}
        >
          Open booking communications
        </Link>
        {' · '}
        <Link className="underline" href="/app/communications/">
          Communication Center
        </Link>
        {' · '}
        <Link
          className="underline"
          href={`/app/communications/reminders/?bookingId=${encodeURIComponent(bookingId)}`}
        >
          Reminders
        </Link>
      </p>
    </ContentCard>
  );
}
