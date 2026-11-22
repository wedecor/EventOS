import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageLoaderProps = {
  label?: string;
  className?: string;
};

export function PageLoader({ label = 'Loading…', className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
