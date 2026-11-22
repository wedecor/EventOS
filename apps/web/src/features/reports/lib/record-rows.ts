import { formatLabel } from '@/features/dashboard/lib/format';

export type CountRow = {
  key: string;
  label: string;
  count: number;
};

/** Convert API Partial/Record status maps into table rows (display only). */
export function recordToCountRows(
  record: Record<string, number> | undefined,
): CountRow[] {
  if (!record) return [];
  return Object.entries(record)
    .map(([key, count]) => ({
      key,
      label: formatLabel(key),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
