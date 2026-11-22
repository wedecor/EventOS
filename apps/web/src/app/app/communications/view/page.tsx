'use client';

import { Suspense } from 'react';
import { CommunicationDetailPage } from '@/features/communications';
import { LoadingState } from '@/shared/components/page';

export default function ViewCommunicationRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading communication…" />}>
      <CommunicationDetailPage />
    </Suspense>
  );
}
