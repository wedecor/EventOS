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
import { CreateQuotationForm } from './quotation-forms';
import { useCreateQuotationMutation } from '../hooks/use-quotation-queries';
import {
  toCreateQuotationRequest,
  type CreateQuotationFormValues,
} from '../schemas/quotation.schemas';

export function CreateQuotationPage() {
  const pathname = usePathname() ?? '/app/quotations/new/';
  const router = useRouter();
  const createMutation = useCreateQuotationMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New quotation' });

  const onSubmit = async (values: CreateQuotationFormValues) => {
    try {
      const quotation = await createMutation.mutateAsync(
        toCreateQuotationRequest(values),
      );
      toast.success('Quotation created');
      router.replace(
        `/app/quotations/view/?id=${encodeURIComponent(quotation.id)}`,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to create quotation.';
      toast.error(message);
    }
  };

  return (
    <RequirePermission permission="quotations:write">
      <PageLayout>
        <PageHeader
          title="New quotation"
          description="Creates a draft via POST /api/v1/quotations (customerId + leadId required)."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Quotation">
            <CreateQuotationForm onSubmit={onSubmit} />
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
