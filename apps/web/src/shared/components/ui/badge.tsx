import { cn } from '@/lib/utils';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement>;

/** Lightweight badge for permission demo chips (F1-02). */
export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-border bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground',
        className,
      )}
      {...props}
    />
  );
}
