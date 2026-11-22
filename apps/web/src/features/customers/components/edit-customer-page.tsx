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
import { CustomerForm } from './customer-form';
import {
  useCustomerQuery,
  useUpdateCustomerMutation,
} from '../hooks/use-customer-queries';
import {
  customerToFormValues,
  toUpdateRequest,
  type CustomerFormValues,
} from '../schemas/customer.schemas';

export function EditCustomerPage() {
  const pathname = usePathname() ?? '/app/customers/edit/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const query = useCustomerQuery(id);
  const updateMutation = useUpdateCustomerMutation(id ?? '');
  const [dirty, setDirty] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data ? `Edit ${query.data.displayName}` : 'Edit customer',
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

  const onSubmit = async (values: CustomerFormValues) => {
    if (!id || !query.data) return;
    try {
      await updateMutation.mutateAsync({
        body: toUpdateRequest(values),
        version: query.data.version,
      });
      toast.success('Customer updated');
      setDirty(false);
      router.replace(`/app/customers/view/?id=${encodeURIComponent(id)}`);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Unable to update customer.';
      toast.error(message);
    }
  };

  return (
    <RequirePermission permission="clients:write">
      <PageLayout>
        <PageHeader
          title={query.data ? `Edit ${query.data.displayName}` : 'Edit customer'}
          description="Updates via PATCH /api/v1/clients/:id with If-Match concurrency."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            id ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  requestLeave(`/app/customers/view/?id=${encodeURIComponent(id)}`)
                }
              >
                Cancel
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/app/customers/">Back</Link>
              </Button>
            )
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing customer id"
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
              title="Unable to load customer"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          </PageSection>
        ) : null}

        {id && query.data ? (
          <PageSection>
            <ContentCard title="Profile">
              <CustomerForm
                key={query.data.id + String(query.data.version)}
                defaultValues={customerToFormValues(query.data)}
                submitLabel="Save changes"
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
