'use client';

import { Suspense } from 'react';
import { CreateCommunicationPage } from '@/features/communications';
import { LoadingState } from '@/shared/components/page';

export default function NewCommunicationRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading…" />}>
      <CreateCommunicationPage />
    </Suspense>
  );
}
