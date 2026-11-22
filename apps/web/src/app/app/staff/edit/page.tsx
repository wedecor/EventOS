'use client';

import { Suspense } from 'react';
import { EditStaffPage } from '@/features/staff';
import { LoadingState } from '@/shared/components/page';

export default function EditStaffRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading staff…" />}>
      <EditStaffPage />
    </Suspense>
  );
}
