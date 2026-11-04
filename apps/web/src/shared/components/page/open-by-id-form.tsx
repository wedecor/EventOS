'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { toast } from '@/shared/components/feedback/toaster';
import { parseUuidInput } from '@/shared/lib/uuid';

type OpenByIdFormProps = {
  id: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  /** Path template; `{id}` is replaced with the encoded UUID. */
  hrefForId: (id: string) => string;
};

/**
 * Shared hub open-by-id control — validates UUID before navigation.
 */
export function OpenByIdForm({
  id,
  label,
  placeholder = 'UUID',
  submitLabel,
  hrefForId,
}: OpenByIdFormProps) {
  const router = useRouter();
  const [value, setValue] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const uuid = parseUuidInput(value);
    if (!uuid) {
      toast.error('Enter a valid UUID.');
      return;
    }
    router.push(hrefForId(uuid));
  };

  return (
    <form className="mt-4 flex flex-wrap items-end gap-2" onSubmit={onSubmit}>
      <div className="min-w-[16rem] flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground" htmlFor={id}>
          {label}
        </label>
        <Input
          id={id}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <Button type="submit" disabled={!value.trim()}>
        {submitLabel}
      </Button>
    </form>
  );
}
