'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
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
  useAddAttachmentMutation,
  useCommunicationAttachmentsQuery,
  useCommunicationQuery,
  useDeleteCommunicationMutation,
  useTransitionCommunicationMutation,
} from '../hooks/use-communication-queries';
import {
  NEXT_COMMUNICATION_STATUS,
  addAttachmentFormSchema,
  formatCommunicationLabel,
  formatWhen,
  toAddAttachmentRequest,
  type AddAttachmentFormValues,
} from '../schemas/communication.schemas';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

export function CommunicationDetailPage() {
  const pathname = usePathname() ?? '/app/communications/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useCommunicationQuery(id);
  const attachmentsQuery = useCommunicationAttachmentsQuery(id);
  const transitionMutation = useTransitionCommunicationMutation(id ?? '');
  const deleteMutation = useDeleteCommunicationMutation();
  const addAttachmentMutation = useAddAttachmentMutation(id ?? '');
  const [failureReason, setFailureReason] = useState('');

  const attachmentForm = useForm<AddAttachmentFormValues>({
    resolver: zodResolver(addAttachmentFormSchema),
    defaultValues: {
      fileName: '',
      mimeType: 'application/pdf',
      fileSizeBytes: '',
      storageKey: '',
    },
  });

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data
      ? formatCommunicationLabel(query.data.status)
      : 'Communication',
  });

  const nextStatus = query.data
    ? NEXT_COMMUNICATION_STATUS[query.data.status]
    : null;

  const onAdvance = async () => {
    if (!id || !query.data || !nextStatus) return;
    try {
      await transitionMutation.mutateAsync({
        body: {
          status: nextStatus,
          ...(nextStatus === 'failed' && failureReason.trim()
            ? { failureReason: failureReason.trim() }
            : {}),
        },
        version: query.data.version,
      });
      toast.success(`Moved to ${formatCommunicationLabel(nextStatus)}`);
      setFailureReason('');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to transition communication.',
      );
    }
  };

  const onDelete = async () => {
    if (!id || !query.data) return;
    try {
      await deleteMutation.mutateAsync({
        id,
        version: query.data.version,
      });
      toast.success('Communication soft-deleted');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to delete communication.',
      );
    }
  };

  const onAddAttachment = async (values: AddAttachmentFormValues) => {
    if (!id) return;
    try {
      await addAttachmentMutation.mutateAsync(toAddAttachmentRequest(values));
      toast.success('Attachment metadata registered');
      attachmentForm.reset({
        fileName: '',
        mimeType: 'application/pdf',
        fileSizeBytes: '',
        storageKey: '',
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to register attachment.',
      );
    }
  };

  return (
    <RequirePermission permission="communications:read">
      <PageLayout>
        <PageHeader
          title="Communication"
          description="GET /api/v1/communications/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {query.data?.bookingId ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/communications/?bookingId=${encodeURIComponent(query.data.bookingId)}`}
                  >
                    Booking communications
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/communications/">All communications</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing communication id"
              description="Open a communication with ?id=<uuid>."
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
              title="Unable to load communication"
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
                  <DetailField label="ID" value={query.data.id} />
                  <DetailField
                    label="Status"
                    value={formatCommunicationLabel(query.data.status)}
                  />
                  <DetailField
                    label="Channel"
                    value={formatCommunicationLabel(query.data.channel)}
                  />
                  <DetailField
                    label="Direction"
                    value={formatCommunicationLabel(query.data.direction)}
                  />
                  <DetailField
                    label="Subject"
                    value={query.data.subject ?? '—'}
                  />
                  <DetailField
                    label="Occurred"
                    value={formatWhen(query.data.occurredAt)}
                  />
                  <DetailField
                    label="Booking"
                    value={
                      query.data.bookingId ? (
                        <Link
                          className="underline"
                          href={`/app/bookings/view/?id=${encodeURIComponent(query.data.bookingId)}`}
                        >
                          {query.data.bookingId}
                        </Link>
                      ) : (
                        '—'
                      )
                    }
                  />
                  <DetailField
                    label="Customer"
                    value={query.data.customerId ?? '—'}
                  />
                  <DetailField
                    label="Vendor"
                    value={query.data.vendorId ?? '—'}
                  />
                  <DetailField
                    label="Failure reason"
                    value={query.data.failureReason ?? '—'}
                  />
                  <DetailField
                    label="Version"
                    value={String(query.data.version)}
                  />
                  <DetailField
                    label="Updated"
                    value={formatWhen(query.data.updatedAt)}
                  />
                </dl>
                {query.data.body ? (
                  <p className="mt-4 whitespace-pre-wrap rounded-md border border-border p-3 text-sm">
                    {query.data.body}
                  </p>
                ) : null}
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard
                title="Lifecycle"
                description="Advance along the preferred delivery path (If-Match)."
              >
                <div className="flex flex-wrap items-end gap-3">
                  {nextStatus ? (
                    <>
                      {nextStatus === 'failed' ? (
                        <label className="grid gap-1 text-sm">
                          <span className="text-xs text-muted-foreground">
                            Failure reason
                          </span>
                          <Input
                            value={failureReason}
                            onChange={(e) => setFailureReason(e.target.value)}
                            placeholder="Optional"
                          />
                        </label>
                      ) : null}
                      <Can permission="communications:write">
                        <Button
                          type="button"
                          disabled={transitionMutation.isPending}
                          onClick={() => void onAdvance()}
                        >
                          Advance to{' '}
                          {formatCommunicationLabel(nextStatus)}
                        </Button>
                      </Can>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No preferred next status from{' '}
                      {formatCommunicationLabel(query.data.status)}.
                    </p>
                  )}
                  <Can permission="communications:write">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={
                        deleteMutation.isPending || Boolean(query.data.deletedAt)
                      }
                      onClick={() => void onDelete()}
                    >
                      Soft delete
                    </Button>
                  </Can>
                </div>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard
                title="Attachments"
                description="Metadata only — no binary upload."
              >
                {attachmentsQuery.isLoading ? (
                  <LoadingState variant="skeleton" rows={2} />
                ) : null}
                {attachmentsQuery.isError ? (
                  <ErrorState
                    title="Unable to load attachments"
                    description={
                      attachmentsQuery.error instanceof ApiError
                        ? attachmentsQuery.error.message
                        : 'Request failed.'
                    }
                    onRetry={() => void attachmentsQuery.refetch()}
                  />
                ) : null}
                {!attachmentsQuery.isLoading &&
                !attachmentsQuery.isError &&
                (attachmentsQuery.data ?? []).length === 0 ? (
                  <EmptyState
                    title="No attachments"
                    description="Register file metadata for this communication."
                  />
                ) : null}
                {(attachmentsQuery.data ?? []).length > 0 ? (
                  <ul className="mb-4 space-y-2">
                    {(attachmentsQuery.data ?? []).map((attachment) => (
                      <li
                        key={attachment.id}
                        className="rounded-md border border-border p-3 text-sm"
                      >
                        <p className="font-medium">
                          {attachment.fileName ?? 'Unnamed file'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attachment.mimeType ?? '—'}
                          {attachment.fileSizeBytes != null
                            ? ` · ${attachment.fileSizeBytes} bytes`
                            : ''}
                          {attachment.storageKey
                            ? ` · ${attachment.storageKey}`
                            : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                <Can permission="communications:write">
                  <Form {...attachmentForm}>
                    <form
                      className="grid gap-2 sm:grid-cols-2"
                      onSubmit={attachmentForm.handleSubmit(onAddAttachment)}
                    >
                      <FormField
                        control={attachmentForm.control}
                        name="fileName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="invoice.pdf" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={attachmentForm.control}
                        name="mimeType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>MIME type</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={attachmentForm.control}
                        name="fileSizeBytes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Size (bytes)</FormLabel>
                            <FormControl>
                              <Input {...field} inputMode="numeric" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={attachmentForm.control}
                        name="storageKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Storage key</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="s3://bucket/key"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="sm:col-span-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addAttachmentMutation.isPending}
                        >
                          Register attachment
                        </Button>
                      </div>
                    </form>
                  </Form>
                </Can>
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
