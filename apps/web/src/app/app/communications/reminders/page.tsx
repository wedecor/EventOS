'use client';

import { Suspense } from 'react';
import { RemindersPage } from '@/features/communications';
import { LoadingState } from '@/shared/components/page';

export default function RemindersRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading reminders…" />}>
      <RemindersPage />
    </Suspense>
  );
}
