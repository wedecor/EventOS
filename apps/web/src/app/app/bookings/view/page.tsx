'use client';

import { Suspense } from 'react';
import { BookingDetailPage } from '@/features/bookings';
import { LoadingState } from '@/shared/components/page';

export default function ViewBookingRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading booking…" />}>
      <BookingDetailPage />
    </Suspense>
  );
}
