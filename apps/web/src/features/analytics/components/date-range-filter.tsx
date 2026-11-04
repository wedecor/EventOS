'use client';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';

type DateRangeFilterProps = {
  fromInput: string;
  toInput: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  idPrefix?: string;
};

export function DateRangeFilter({
  fromInput,
  toInput,
  onFromChange,
  onToChange,
  onApply,
  onClear,
  idPrefix = 'analytics',
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`${idPrefix}-from`}
        >
          From
        </label>
        <Input
          id={`${idPrefix}-from`}
          type="date"
          className="w-44"
          value={fromInput}
          onChange={(e) => onFromChange(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`${idPrefix}-to`}
        >
          To
        </label>
        <Input
          id={`${idPrefix}-to`}
          type="date"
          className="w-44"
          value={toInput}
          onChange={(e) => onToChange(e.target.value)}
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onApply}>
        Apply range
      </Button>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
