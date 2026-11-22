'use client';

import { Suspense } from 'react';
import { OperationsCalendarPage } from '@/features/calendar';
import { LoadingState } from '@/shared/components/page';

export default function CalendarRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading operations calendar…" />}>
      <OperationsCalendarPage />
    </Suspense>
  );
}
