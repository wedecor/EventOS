'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/forms/form';
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
import {
  useApproveQuotationMutation,
  useQuotationQuery,
  useRejectQuotationMutation,
  useReviseQuotationMutation,
  useSendQuotationMutation,
} from '../hooks/use-quotation-queries';
import {
  formatQuotationDate,
  formatQuotationMoney,
  formatQuotationStatus,
  formatQuotationWhen,
} from '../lib/format';
import {
  rejectQuotationFormSchema,
  type Quotation,
  type RejectQuotationFormValues,
} from '../schemas/quotation.schemas';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function QuotationDetailPage() {
  const pathname = usePathname() ?? '/app/quotations/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useQuotationQuery(id);
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data
      ? `Q-${query.data.quotationNumber}`
      : 'Quotation',
  });

  return (
    <RequirePermission permission="quotations:read">
      <PageLayout>
        <PageHeader
          title={
            query.data
              ? `Quotation Q-${query.data.quotationNumber}`
              : 'Quotation'
          }
          description="Header and server totals from GET /api/v1/quotations/:id. Line items and PDF are not available in this API."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            id && query.data?.status === 'draft' ? (
              <Can permission="quotations:write">
                <Button asChild variant="outline">
                  <Link
                    href={`/app/quotations/edit/?id=${encodeURIComponent(id)}`}
                  >
                    Edit
                  </Link>
                </Button>
              </Can>
            ) : null
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing quotation id"
              description="Open a quotation with ?id=<uuid>. List browsing is not available until GET /quotations ships."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={6} />
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

        {id && query.data ? (
          <>
            <PageSection>
              <ContentCard title="Summary">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="Number"
                    value={`Q-${query.data.quotationNumber}`}
                  />
                  <DetailField
                    label="Revision"
                    value={String(query.data.revisionNumber)}
                  />
                  <DetailField
                    label="Status"
                    value={formatQuotationStatus(query.data.status)}
                  />
                  <DetailField
                    label="Version"
                    value={String(query.data.version)}
                  />
                  <DetailField label="Customer ID" value={query.data.customerId} />
                  <DetailField
                    label="Lead ID"
                    value={query.data.leadId ?? '—'}
                  />
                  <DetailField
                    label="Event type"
                    value={query.data.eventType ?? '—'}
                  />
                  <DetailField
                    label="Venue"
                    value={query.data.venue ?? '—'}
                  />
                  <DetailField
                    label="Event start"
                    value={formatQuotationDate(query.data.eventStartDate)}
                  />
                  <DetailField
                    label="Event end"
                    value={formatQuotationDate(query.data.eventEndDate)}
                  />
                  <DetailField
                    label="Valid until"
                    value={formatQuotationDate(query.data.validUntil)}
                  />
                  <DetailField
                    label="Superseded by"
                    value={query.data.supersededById ?? '—'}
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Notes"
                      value={query.data.notes ?? '—'}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Terms"
                      value={query.data.terms ?? '—'}
                    />
                  </div>
                  <DetailField
                    label="Created"
                    value={formatQuotationWhen(query.data.createdAt)}
                  />
                  <DetailField
                    label="Updated"
                    value={formatQuotationWhen(query.data.updatedAt)}
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Pricing (server totals)">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField
                    label="Subtotal"
                    value={formatQuotationMoney(
                      query.data.subtotalAmount,
                      query.data.currency,
                    )}
                  />
                  <DetailField
                    label="Discount"
                    value={formatQuotationMoney(
                      query.data.discountAmount,
                      query.data.currency,
                    )}
                  />
                  <DetailField
                    label="Tax"
                    value={formatQuotationMoney(
                      query.data.taxAmount,
                      query.data.currency,
                    )}
                  />
                  <DetailField
                    label="Total"
                    value={formatQuotationMoney(
                      query.data.totalAmount,
                      query.data.currency,
                    )}
                  />
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">
                  Line-item rows cannot be listed: there is no GET line-items
                  endpoint and GET quotation does not embed lines. Totals above
                  are returned by the API.
                </p>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Actions">
                <QuotationActionsPanel quotation={query.data} />
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}

function QuotationActionsPanel({ quotation }: { quotation: Quotation }) {
  const router = useRouter();
  const sendMutation = useSendQuotationMutation(quotation.id);
  const approveMutation = useApproveQuotationMutation(quotation.id);
  const rejectMutation = useRejectQuotationMutation(quotation.id);
  const reviseMutation = useReviseQuotationMutation(quotation.id);

  const [sendOpen, setSendOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const rejectForm = useForm<RejectQuotationFormValues>({
    resolver: zodResolver(rejectQuotationFormSchema),
    defaultValues: { reason: '' },
  });

  const busy =
    sendMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    reviseMutation.isPending;

  const onSend = async () => {
    try {
      await sendMutation.mutateAsync(quotation.version);
      toast.success('Quotation marked as sent');
      setSendOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to send quotation.',
      );
    }
  };

  const onApprove = async () => {
    try {
      const result = await approveMutation.mutateAsync(quotation.version);
      if (result.eventId) {
        toast.success(`Quotation approved (event ${result.eventId})`);
      } else {
        toast.success(
          'Quotation approved (no event yet — advance payment may still be required).',
        );
      }
      setApproveOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to approve quotation.',
      );
    }
  };

  const onReject = async (values: RejectQuotationFormValues) => {
    try {
      const reason = values.reason.trim();
      await rejectMutation.mutateAsync({
        body: reason ? { reason } : {},
        version: quotation.version,
      });
      toast.success('Quotation rejected');
      setRejectOpen(false);
      rejectForm.reset({ reason: '' });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to reject quotation.',
      );
    }
  };

  const onRevise = async () => {
    try {
      const next = await reviseMutation.mutateAsync(quotation.version);
      toast.success(`Revision ${next.revisionNumber} created`);
      setReviseOpen(false);
      router.replace(
        `/app/quotations/view/?id=${encodeURIComponent(next.id)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to revise quotation.',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {quotation.status === 'draft' ? (
          <Can permission="quotations:send">
            <Button
              type="button"
              disabled={busy}
              onClick={() => setSendOpen(true)}
            >
              Send
            </Button>
          </Can>
        ) : null}

        {quotation.status === 'sent' ? (
          <>
            <Can permission="quotations:approve">
              <Button
                type="button"
                disabled={busy}
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </Button>
            </Can>
            <Can permission="quotations:reject">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>
            </Can>
          </>
        ) : null}

        {quotation.status !== 'superseded' ? (
          <Can permission="quotations:revise">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setReviseOpen(true)}
            >
              Revise
            </Button>
          </Can>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Send requires at least one line item and a positive total on the server.
        Approve may return an event id when booking conversion succeeds.
      </p>

      {rejectOpen ? (
        <Form {...rejectForm}>
          <form
            className="space-y-3 rounded-md border p-3"
            noValidate
            onSubmit={rejectForm.handleSubmit(onReject)}
          >
            <FormField
              control={rejectForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reject reason (optional)</FormLabel>
                  <FormControl>
                    <Input disabled={busy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={busy}>
                Confirm reject
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setRejectOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      <ConfirmDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        title="Send quotation?"
        description="Marks this draft as sent (POST …/send). No channel or recipient is accepted by the API."
        confirmLabel="Send"
        onConfirm={() => void onSend()}
      />
      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve quotation?"
        description="Records internal approval. Booking/event creation is a server-side side effect when preconditions pass."
        confirmLabel="Approve"
        onConfirm={() => void onApprove()}
      />
      <ConfirmDialog
        open={reviseOpen}
        onOpenChange={setReviseOpen}
        title="Create revision?"
        description="Supersedes this quotation and opens the new draft revision."
        confirmLabel="Revise"
        onConfirm={() => void onRevise()}
      />
    </div>
  );
}
