'use client';

import { Suspense } from 'react';
import { InventoryItemDetailPage } from '@/features/inventory';
import { LoadingState } from '@/shared/components/page';

export default function ViewInventoryItemRoutePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading inventory item…" />}>
      <InventoryItemDetailPage />
    </Suspense>
  );
}
