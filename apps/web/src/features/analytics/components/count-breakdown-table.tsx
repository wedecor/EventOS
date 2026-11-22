'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/shared/components/data-display/data-table';
import { recordToCountRows, type CountRow } from '../lib/record-rows';

const columns: ColumnDef<CountRow>[] = [
  { accessorKey: 'label', header: 'Key' },
  { accessorKey: 'count', header: 'Count' },
];

export function CountBreakdownTable({
  record,
}: {
  record: Record<string, number> | undefined;
}) {
  const rows = recordToCountRows(record);
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No breakdown rows.</p>;
  }
  return <DataTable columns={columns} data={rows} />;
}
