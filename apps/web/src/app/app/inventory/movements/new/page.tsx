'use client';

import { Suspense } from 'react';
import { CreateMovementPage } from '@/features/inventory';
import { LoadingState } from '@/shared/components/page';

export default function NewMovementRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <CreateMovementPage />
    </Suspense>
  );
}
