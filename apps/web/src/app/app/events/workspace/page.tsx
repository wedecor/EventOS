'use client';

import { Suspense } from 'react';
import { EventWorkspacePage } from '@/features/workspace';
import { LoadingState } from '@/shared/components/page';

export default function EventWorkspaceRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading workspace…" />}>
      <EventWorkspacePage />
    </Suspense>
  );
}
