'use client';

import type { ReactNode } from 'react';
import { ApiError } from '@/shared/types/api';
import { ContentCard } from '@/shared/components/page';
import { EmptyState, ErrorState, LoadingState } from '@/shared/components/page';

type DashboardWidgetProps = {
  title: string;
  description?: string;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function DashboardWidget({
  title,
  description,
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyTitle = 'Nothing to show',
  emptyDescription = 'No data is available for this widget yet.',
  onRetry,
  children,
}: DashboardWidgetProps) {
  const message =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : 'Failed to load dashboard data.';

  return (
    <ContentCard title={title} description={description}>
      {isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
      {!isLoading && isError ? (
        <ErrorState title="Unable to load" description={message} onRetry={onRetry} />
      ) : null}
      {!isLoading && !isError && isEmpty ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
      {!isLoading && !isError && !isEmpty ? children : null}
    </ContentCard>
  );
}
