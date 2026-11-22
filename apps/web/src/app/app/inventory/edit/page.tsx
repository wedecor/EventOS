'use client';

import { Suspense } from 'react';
import { EditInventoryItemPage } from '@/features/inventory';
import { LoadingState } from '@/shared/components/page';

export default function EditInventoryItemRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading inventory item…" />}>
      <EditInventoryItemPage />
    </Suspense>
  );
}
