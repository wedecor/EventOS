'use client';

import { Suspense } from 'react';
import { CommunicationsDashboardPage } from '@/features/communications';
import { LoadingState } from '@/shared/components/page';

export default function CommunicationsRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading communications…" />}>
      <CommunicationsDashboardPage />
    </Suspense>
  );
}
