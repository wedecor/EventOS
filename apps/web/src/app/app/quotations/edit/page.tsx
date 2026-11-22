'use client';

import { Suspense } from 'react';
import { EditQuotationPage } from '@/features/quotations';
import { LoadingState } from '@/shared/components/page';

export default function EditQuotationRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading quotation…" />}>
      <EditQuotationPage />
    </Suspense>
  );
}
