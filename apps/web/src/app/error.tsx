'use client';

import { useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Application error</h1>
      <p className="max-w-md text-sm text-muted-foreground">{error.message}</p>
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
