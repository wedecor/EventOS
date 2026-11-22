'use client';

import { Suspense } from 'react';
import { StaffDetailPage } from '@/features/staff';
import { LoadingState } from '@/shared/components/page';

export default function ViewStaffRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading staff…" />}>
      <StaffDetailPage />
    </Suspense>
  );
}
