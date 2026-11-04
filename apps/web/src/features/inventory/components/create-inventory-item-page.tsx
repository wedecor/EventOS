'use client';

import { usePathname, useRouter } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import {
  ContentCard,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { InventoryItemForm } from './inventory-item-form';
import { useCreateInventoryItemMutation } from '../hooks/use-inventory-queries';
import {
  toCreateInventoryItemRequest,
  type InventoryItemFormValues,
} from '../schemas/inventory.schemas';

export function CreateInventoryItemPage() {
  const pathname = usePathname() ?? '/app/inventory/new/';
  const router = useRouter();
  const createMutation = useCreateInventoryItemMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New item' });

  const onSubmit = async (values: InventoryItemFormValues) => {
    try {
      const item = await createMutation.mutateAsync(
        toCreateInventoryItemRequest(values),
      );
      toast.success('Inventory item created');
      router.replace(`/app/inventory/view/?id=${encodeURIComponent(item.id)}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to create inventory item.',
      );
    }
  };

  return (
    <RequirePermission permission="inventory:write">
      <PageLayout>
        <PageHeader
          title="New inventory item"
          description="Creates an item via POST /api/v1/inventory/items."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Item">
            <InventoryItemForm
              mode="create"
              submitLabel="Create item"
              onSubmit={onSubmit}
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
