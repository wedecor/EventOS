'use client';

import { Suspense } from 'react';
import { BookingFinancePage } from '@/features/finance';
import { LoadingState } from '@/shared/components/page';

export default function BookingFinanceRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading booking finance…" />}>
      <BookingFinancePage />
    </Suspense>
  );
}
