'use client';

import { Suspense } from 'react';
import { LeadDetailPage } from '@/features/leads';
import { LoadingState } from '@/shared/components/page';

export default function ViewLeadRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading lead…" />}>
      <LeadDetailPage />
    </Suspense>
  );
}
