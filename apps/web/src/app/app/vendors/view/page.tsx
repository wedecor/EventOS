'use client';

import { Suspense } from 'react';
import { VendorDetailPage } from '@/features/vendors';
import { LoadingState } from '@/shared/components/page';

export default function ViewVendorRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading vendor…" />}>
      <VendorDetailPage />
    </Suspense>
  );
}
