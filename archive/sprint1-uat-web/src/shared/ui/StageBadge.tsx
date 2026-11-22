const STAGE_STYLE: Record<string, string> = {
  new: 'bg-sky-100 text-sky-800',
  in_talks: 'bg-amber-100 text-amber-900',
  approved: 'bg-emerald-100 text-emerald-900',
  completed: 'bg-slate-200 text-slate-800',
  lost: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export function StageBadge({ stage }: { stage: string }) {
  const label = stage.replace(/_/g, ' ');
  const style = STAGE_STYLE[stage] ?? 'bg-slate-100 text-slate-700';

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {label}
    </span>
  );
}
