import { cn } from '@/lib/utils';
import { ContentCard } from '@/shared/components/page';

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  className?: string;
};

export function KpiCard({ label, value, hint, className }: KpiCardProps) {
  return (
    <ContentCard className={cn('p-4 sm:p-5', className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </ContentCard>
  );
}
