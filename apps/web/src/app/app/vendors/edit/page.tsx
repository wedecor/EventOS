'use client';

import { Suspense } from 'react';
import { EditVendorPage } from '@/features/vendors';
import { LoadingState } from '@/shared/components/page';

export default function EditVendorRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading vendor…" />}>
      <EditVendorPage />
    </Suspense>
  );
}
