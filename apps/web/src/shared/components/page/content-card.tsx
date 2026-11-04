import { cn } from '@/lib/utils';

type ContentCardProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  description?: string;
};

export function ContentCard({
  title,
  description,
  className,
  children,
  ...props
}: ContentCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6',
        className,
      )}
      {...props}
    >
      {(title || description) && (
        <div className="mb-4 space-y-1">
          {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      {children}
    </div>
  );
}
