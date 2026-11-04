'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { ContentCard } from '@/shared/components/page';
import {
  CALENDAR_ENTRY_SOURCES,
  formatCalendarSourceLabel,
  type CalendarEntrySource,
} from '../schemas/calendar.schemas';

type CalendarFilterPanelProps = {
  sources: CalendarEntrySource[];
  onSourcesChange: (sources: CalendarEntrySource[]) => void;
  status: string;
  onStatusChange: (status: string) => void;
  bookingId: string;
  onBookingIdChange: (bookingId: string) => void;
};

export function CalendarFilterPanel({
  sources,
  onSourcesChange,
  status,
  onStatusChange,
  bookingId,
  onBookingIdChange,
}: CalendarFilterPanelProps) {
  function toggleSource(source: CalendarEntrySource) {
    onSourcesChange(
      sources.includes(source)
        ? sources.filter((s) => s !== source)
        : [...sources, source],
    );
  }

  return (
    <ContentCard
      title="Filters"
      description={
        bookingId
          ? `Scoped to booking ${bookingId}`
          : 'Filter by source, status, or booking'
      }
    >
      <div className="grid gap-4">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Sources
          </p>
          <div className="flex flex-wrap gap-2">
            {CALENDAR_ENTRY_SOURCES.map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => toggleSource(source)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  sources.includes(source)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/40',
                )}
              >
                {formatCalendarSourceLabel(source)}
              </button>
            ))}
            {sources.length > 0 ? (
              <button
                type="button"
                onClick={() => onSourcesChange([])}
                className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted/40"
              >
                Clear sources
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Status</span>
            <Input
              placeholder="e.g. confirmed, pending"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-48"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-xs text-muted-foreground">Booking ID</span>
            <Input
              placeholder="Booking UUID"
              value={bookingId}
              onChange={(e) => onBookingIdChange(e.target.value)}
              className="w-64"
            />
          </label>
          {bookingId ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => onBookingIdChange('')}
            >
              Clear booking filter
            </Button>
          ) : null}
        </div>
      </div>
    </ContentCard>
  );
}
