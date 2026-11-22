'use client';

import { Suspense } from 'react';
import { Customer360Page } from '@/features/customers';
import { LoadingState } from '@/shared/components/page';

export default function ViewCustomerRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading customer…" />}>
      <Customer360Page />
    </Suspense>
  );
}
