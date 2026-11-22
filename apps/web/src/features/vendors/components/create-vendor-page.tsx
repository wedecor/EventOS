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
import { VendorForm } from './vendor-form';
import { useCreateVendorMutation } from '../hooks/use-vendor-queries';
import {
  toCreateVendorRequest,
  type VendorFormValues,
} from '../schemas/vendor.schemas';

export function CreateVendorPage() {
  const pathname = usePathname() ?? '/app/vendors/new/';
  const router = useRouter();
  const createMutation = useCreateVendorMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New vendor' });

  const onSubmit = async (values: VendorFormValues) => {
    try {
      const vendor = await createMutation.mutateAsync(
        toCreateVendorRequest(values),
      );
      toast.success('Vendor created');
      router.replace(`/app/vendors/view/?id=${encodeURIComponent(vendor.id)}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to create vendor.',
      );
    }
  };

  return (
    <RequirePermission permission="vendors:write">
      <PageLayout>
        <PageHeader
          title="New vendor"
          description="Creates a vendor via POST /api/v1/vendors."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Vendor">
            <VendorForm
              mode="create"
              submitLabel="Create vendor"
              onSubmit={onSubmit}
            />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
