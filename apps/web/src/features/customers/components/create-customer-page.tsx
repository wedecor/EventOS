'use client';

import { usePathname, useRouter } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { ContentCard, PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { CustomerForm } from './customer-form';
import { useCreateCustomerMutation } from '../hooks/use-customer-queries';
import { toCreateRequest, type CustomerFormValues } from '../schemas/customer.schemas';

export function CreateCustomerPage() {
  const pathname = usePathname() ?? '/app/customers/new/';
  const router = useRouter();
  const createMutation = useCreateCustomerMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New customer' });

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      const customer = await createMutation.mutateAsync(toCreateRequest(values));
      toast.success('Customer created');
      router.replace(`/app/customers/view/?id=${encodeURIComponent(customer.id)}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to create customer.';
      toast.error(message);
    }
  };

  return (
    <RequirePermission permission="clients:write">
      <PageLayout>
        <PageHeader
          title="New customer"
          description="Creates a client profile via POST /api/v1/clients."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Profile">
            <CustomerForm submitLabel="Create customer" onSubmit={onSubmit} />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
