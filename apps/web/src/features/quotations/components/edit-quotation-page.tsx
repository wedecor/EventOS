'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { UpdateQuotationForm } from './quotation-forms';
import {
  useQuotationQuery,
  useUpdateQuotationMutation,
} from '../hooks/use-quotation-queries';
import {
  quotationToUpdateFormValues,
  toUpdateQuotationRequest,
  type UpdateQuotationFormValues,
} from '../schemas/quotation.schemas';

export function EditQuotationPage() {
  const pathname = usePathname() ?? '/app/quotations/edit/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const query = useQuotationQuery(id);
  const updateMutation = useUpdateQuotationMutation(id ?? '');
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data
      ? `Edit Q-${query.data.quotationNumber}`
      : 'Edit quotation',
  });

  const onDirtyChange = useCallback((next: boolean) => {
    setDirty(next);
  }, []);

  const requestLeave = (href: string) => {
    if (!dirty) {
      router.push(href);
      return;
    }
    setPendingHref(href);
    setLeaveOpen(true);
  };

  const onSubmit = async (values: UpdateQuotationFormValues) => {
    if (!id || !query.data) return;
    if (query.data.status !== 'draft') {
      toast.error('Only draft quotations can be updated.');
      return;
    }
    try {
      await updateMutation.mutateAsync({
        body: toUpdateQuotationRequest(values),
        version: query.data.version,
      });
      toast.success('Quotation updated');
      setDirty(false);
      router.replace(`/app/quotations/view/?id=${encodeURIComponent(id)}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to update quotation.';
      toast.error(message);
    }
  };

  return (
    <RequirePermission permission="quotations:write">
      <PageLayout>
        <PageHeader
          title={
            query.data
              ? `Edit Q-${query.data.quotationNumber}`
              : 'Edit quotation'
          }
          description="Updates validUntil, notes, discount, and tax via PATCH with If-Match."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  requestLeave(
                    `/app/quotations/view/?id=${encodeURIComponent(id)}`,
                  )
                }
              >
                Cancel
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/app/quotations/">Back</Link>
              </Button>
            )
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing quotation id"
              description="Edit requires ?id=<uuid>."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={5} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load quotation"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          </PageSection>
        ) : null}

        {id && query.data && query.data.status !== 'draft' ? (
          <PageSection>
            <EmptyState
              title="Not editable"
              description={`Only draft quotations can be updated. Current status: ${query.data.status}.`}
            />
          </PageSection>
        ) : null}

        {id && query.data && query.data.status === 'draft' ? (
          <PageSection>
            <ContentCard title="Header fields">
              <UpdateQuotationForm
                key={query.data.id + String(query.data.version)}
                defaultValues={quotationToUpdateFormValues(query.data)}
                onSubmit={onSubmit}
                onDirtyChange={onDirtyChange}
              />
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Discard unsaved changes?"
        description="You have unsaved edits. Leave this page without saving?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => {
          setLeaveOpen(false);
          setDirty(false);
          if (pendingHref) {
            router.push(pendingHref);
            setPendingHref(null);
          }
        }}
      />
    </RequirePermission>
  );
}
