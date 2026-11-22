type LoadingPanelProps = {
  label?: string;
  className?: string;
};

export function LoadingPanel({
  label = 'Loading…',
  className = '',
}: LoadingPanelProps) {
  return (
    <div
      className={[
        'animate-pulse rounded-lg border border-slate-200 bg-white p-6',
        className,
      ].join(' ')}
      aria-busy="true"
    >
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-1/2 rounded bg-slate-200" />
      </div>
    </div>
  );
}
