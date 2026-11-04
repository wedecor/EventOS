import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { LoadingSkeleton } from '@/shared/components/data-display/loading-skeleton';
import { PageLoader } from '@/shared/components/feedback/page-loader';

export { EmptyState } from '@/shared/components/data-display/empty-state';

type LoadingStateProps = {
  label?: string;
  variant?: 'page' | 'skeleton';
  rows?: number;
  className?: string;
};

export function LoadingState({
  label = 'Loading…',
  variant = 'page',
  rows = 4,
  className,
}: LoadingStateProps) {
  if (variant === 'skeleton') {
    return <LoadingSkeleton rows={rows} className={className} />;
  }
  return <PageLoader label={label} className={className} />;
}

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, contact support.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center',
        className,
      )}
      role="alert"
    >
      <AlertTriangle className="mb-3 h-10 w-10 text-destructive" />
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {onRetry ? (
        <Button type="button" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
