'use client';

import { Suspense } from 'react';
import { BookingMovementsPage } from '@/features/inventory';
import { LoadingState } from '@/shared/components/page';

export default function BookingMovementsRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading movements…" />}>
      <BookingMovementsPage />
    </Suspense>
  );
}
