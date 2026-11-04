'use client';

import { Suspense } from 'react';
import { QuotationDetailPage } from '@/features/quotations';
import { LoadingState } from '@/shared/components/page';

export default function ViewQuotationRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading quotation…" />}>
      <QuotationDetailPage />
    </Suspense>
  );
}
