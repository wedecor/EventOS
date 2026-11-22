'use client';

import { Suspense } from 'react';
import { EditCustomerPage } from '@/features/customers';
import { LoadingState } from '@/shared/components/page';

export default function EditCustomerRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading customer…" />}>
      <EditCustomerPage />
    </Suspense>
  );
}
