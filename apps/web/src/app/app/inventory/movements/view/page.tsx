'use client';

import { Suspense } from 'react';
import { MovementDetailPage } from '@/features/inventory';
import { LoadingState } from '@/shared/components/page';

export default function ViewMovementRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading movement…" />}>
      <MovementDetailPage />
    </Suspense>
  );
}
