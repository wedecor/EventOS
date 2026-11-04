'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  useAdvanceExecutionStageMutation,
  useAssignExecutionOwnerMutation,
  useBookingQuery,
  useCancelBookingMutation,
  useCompleteBookingMutation,
  useUpdateBookingStatusMutation,
} from '../hooks/use-booking-queries';
import {
  bookingTitle,
  formatBookingDate,
  formatBookingLabel,
  formatBookingWhen,
} from '../lib/format';
import {
  advanceStageFormSchema,
  assignOwnerFormSchema,
  cancelBookingFormSchema,
  toAdvanceStageRequest,
  type AdvanceStageFormValues,
  type AssignOwnerFormValues,
  type Booking,
  type CancelBookingFormValues,
} from '../schemas/booking.schemas';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

function IdLink({
  href,
  id,
  label,
}: {
  href: string;
  id: string;
  label: string;
}) {
  return (
    <Link className="text-primary underline-offset-2 hover:underline" href={href}>
      {label}: {id}
    </Link>
  );
}

export function BookingDetailPage() {
  const pathname = usePathname() ?? '/app/bookings/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useBookingQuery(id);
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data ? bookingTitle(query.data) : 'Booking',
  });

  return (
    <RequirePermission permission="bookings:read">
      <PageLayout>
        <PageHeader
          title={query.data ? bookingTitle(query.data) : 'Booking'}
          description="Event hub record from GET /api/v1/bookings/:id. Nested finance/ops panels are deferred."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {id ? (
                <Can permission="workspace:read">
                  <Button asChild>
                    <Link
                      href={`/app/events/workspace/?id=${encodeURIComponent(id)}`}
                    >
                      Workspace
                    </Link>
                  </Button>
                </Can>
              ) : null}
              {id ? (
                <Can permission="inventory:read">
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/inventory/movements/?bookingId=${encodeURIComponent(id)}`}
                    >
                      Inventory movements
                    </Link>
                  </Button>
                </Can>
              ) : null}
              {id ? (
                <Can
                  anyOf={[
                    'payments:read',
                    'invoices:read',
                    'expenses:read',
                    'profitability:read',
                  ]}
                >
                  <Button asChild variant="outline">
                    <Link
                      href={`/app/finance/booking/?id=${encodeURIComponent(id)}`}
                    >
                      Finance
                    </Link>
                  </Button>
                </Can>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/bookings/">Back to hub</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing booking id"
              description="Open a booking with ?id=<uuid>. List browsing is not available until GET /bookings ships."
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
              title="Unable to load booking"
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
                    value={`B-${query.data.bookingNumber}`}
                  />
                  <DetailField
                    label="Status"
                    value={formatBookingLabel(query.data.status)}
                  />
                  <DetailField
                    label="Preparation"
                    value={formatBookingLabel(query.data.preparationStatus)}
                  />
                  <DetailField
                    label="Workspace status"
                    value={formatBookingLabel(query.data.workspaceStatus)}
                  />
                  <DetailField
                    label="Operational milestone"
                    value={query.data.operationalMilestone ?? '—'}
                  />
                  <DetailField
                    label="Execution owner"
                    value={query.data.executionOwnerId ?? '—'}
                  />
                  <DetailField
                    label="Event type"
                    value={query.data.eventType ?? '—'}
                  />
                  <DetailField
                    label="Venue"
                    value={query.data.venueName ?? '—'}
                  />
                  <DetailField
                    label="Event start"
                    value={formatBookingDate(query.data.eventStartDate)}
                  />
                  <DetailField
                    label="Event end"
                    value={formatBookingDate(query.data.eventEndDate)}
                  />
                  <DetailField
                    label="Guest count"
                    value={
                      query.data.guestCount != null
                        ? String(query.data.guestCount)
                        : '—'
                    }
                  />
                  <DetailField
                    label="Version"
                    value={String(query.data.version)}
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Requirements"
                      value={query.data.requirementsNotes ?? '—'}
                    />
                  </div>
                  {query.data.cancellationReason ? (
                    <div className="sm:col-span-2">
                      <DetailField
                        label="Cancellation reason"
                        value={query.data.cancellationReason}
                      />
                    </div>
                  ) : null}
                  <DetailField
                    label="Completed"
                    value={formatBookingWhen(query.data.completedAt)}
                  />
                  <DetailField
                    label="Created"
                    value={formatBookingWhen(query.data.createdAt)}
                  />
                  <DetailField
                    label="Updated"
                    value={formatBookingWhen(query.data.updatedAt)}
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Linked records">
                <ul className="space-y-2 text-sm">
                  <li>
                    <IdLink
                      label="Customer"
                      id={query.data.customerId}
                      href={`/app/customers/view/?id=${encodeURIComponent(query.data.customerId)}`}
                    />
                  </li>
                  <li>
                    <IdLink
                      label="Quotation"
                      id={query.data.quotationId}
                      href={`/app/quotations/view/?id=${encodeURIComponent(query.data.quotationId)}`}
                    />
                  </li>
                  {query.data.leadId ? (
                    <li>
                      <IdLink
                        label="Lead"
                        id={query.data.leadId}
                        href={`/app/leads/view/?id=${encodeURIComponent(query.data.leadId)}`}
                      />
                    </li>
                  ) : (
                    <li className="text-muted-foreground">Lead: —</li>
                  )}
                </ul>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Actions">
                <BookingActionsPanel booking={query.data} />
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}

function BookingActionsPanel({ booking }: { booking: Booking }) {
  const statusMutation = useUpdateBookingStatusMutation(booking.id);
  const cancelMutation = useCancelBookingMutation(booking.id);
  const completeMutation = useCompleteBookingMutation(booking.id);
  const ownerMutation = useAssignExecutionOwnerMutation(booking.id);
  const stageMutation = useAdvanceExecutionStageMutation(booking.id);

  const [startPrepOpen, setStartPrepOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const cancelForm = useForm<CancelBookingFormValues>({
    resolver: zodResolver(cancelBookingFormSchema),
    defaultValues: { reason: '' },
  });

  const ownerForm = useForm<AssignOwnerFormValues>({
    resolver: zodResolver(assignOwnerFormSchema),
    defaultValues: { executionOwnerId: booking.executionOwnerId ?? '' },
  });

  const stageForm = useForm<AdvanceStageFormValues>({
    resolver: zodResolver(advanceStageFormSchema),
    defaultValues: {
      milestoneKey: booking.operationalMilestone ?? '',
      preparationStatus: '',
    },
  });

  const busy =
    statusMutation.isPending ||
    cancelMutation.isPending ||
    completeMutation.isPending ||
    ownerMutation.isPending ||
    stageMutation.isPending;

  const canCancel =
    booking.status !== 'cancelled' && booking.status !== 'completed';
  const canStartPrep = booking.status === 'approved';
  const canComplete = booking.status === 'in_execution';
  const canAssignOwner = canCancel;
  const canAdvanceStage =
    booking.status === 'in_preparation' || booking.status === 'in_execution';

  const onStartPrep = async () => {
    try {
      await statusMutation.mutateAsync({
        body: { status: 'in_preparation' },
        version: booking.version,
      });
      toast.success('Booking moved to in preparation');
      setStartPrepOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to update booking status.',
      );
    }
  };

  const onComplete = async () => {
    try {
      await completeMutation.mutateAsync(booking.version);
      toast.success('Booking completed');
      setCompleteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to complete booking.',
      );
    }
  };

  const onCancel = async (values: CancelBookingFormValues) => {
    try {
      await cancelMutation.mutateAsync({
        body: { reason: values.reason.trim() },
        version: booking.version,
      });
      toast.success('Booking cancelled');
      setCancelOpen(false);
      cancelForm.reset({ reason: '' });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to cancel booking.',
      );
    }
  };

  const onAssignOwner = async (values: AssignOwnerFormValues) => {
    try {
      await ownerMutation.mutateAsync({
        body: { executionOwnerId: values.executionOwnerId.trim() },
        version: booking.version,
      });
      toast.success('Execution owner assigned');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to assign execution owner.',
      );
    }
  };

  const onAdvanceStage = async (values: AdvanceStageFormValues) => {
    try {
      await stageMutation.mutateAsync({
        body: toAdvanceStageRequest(values),
        version: booking.version,
      });
      toast.success('Execution stage advanced');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to advance execution stage.',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {canStartPrep ? (
          <Can permission="bookings:status:update">
            <Button
              type="button"
              disabled={busy}
              onClick={() => setStartPrepOpen(true)}
            >
              Start preparation
            </Button>
          </Can>
        ) : null}

        {canComplete ? (
          <Can permission="bookings:complete">
            <Button
              type="button"
              disabled={busy}
              onClick={() => setCompleteOpen(true)}
            >
              Complete
            </Button>
          </Can>
        ) : null}

        {canCancel ? (
          <Can permission="bookings:cancel">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setCancelOpen(true)}
            >
              Cancel booking
            </Button>
          </Can>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        PATCH /status only supports approved → in_preparation. Complete requires
        in_execution. There is no Phase 1 UI/API transition into in_execution via
        this status endpoint — the server rejects other status values.
      </p>

      {canAssignOwner ? (
        <Can permission="bookings:execution:advance">
          <Form {...ownerForm}>
            <form
              className="space-y-3 rounded-md border p-3"
              noValidate
              onSubmit={ownerForm.handleSubmit(onAssignOwner)}
            >
              <p className="text-sm font-medium">Assign execution owner</p>
              <FormField
                control={ownerForm.control}
                name="executionOwnerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff UUID</FormLabel>
                    <FormControl>
                      <Input disabled={busy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={busy}>
                Save owner
              </Button>
            </form>
          </Form>
        </Can>
      ) : null}

      {canAdvanceStage ? (
        <Can permission="bookings:execution:advance">
          <Form {...stageForm}>
            <form
              className="space-y-3 rounded-md border p-3"
              noValidate
              onSubmit={stageForm.handleSubmit(onAdvanceStage)}
            >
              <p className="text-sm font-medium">Advance execution stage</p>
              <FormField
                control={stageForm.control}
                name="milestoneKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. preparation"
                        disabled={busy}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stageForm.control}
                name="preparationStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preparation status (optional)</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        disabled={busy}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Leave unchanged</option>
                        <option value="pending">Pending</option>
                        <option value="ready">Ready</option>
                        <option value="needs_attention">Needs attention</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={busy}>
                Advance stage
              </Button>
            </form>
          </Form>
        </Can>
      ) : null}

      {cancelOpen ? (
        <Form {...cancelForm}>
          <form
            className="space-y-3 rounded-md border border-destructive/30 p-3"
            noValidate
            onSubmit={cancelForm.handleSubmit(onCancel)}
          >
            <FormField
              control={cancelForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation reason</FormLabel>
                  <FormControl>
                    <Input disabled={busy} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={busy}>
                Confirm cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setCancelOpen(false)}
              >
                Back
              </Button>
            </div>
          </form>
        </Form>
      ) : null}

      <ConfirmDialog
        open={startPrepOpen}
        onOpenChange={setStartPrepOpen}
        title="Start preparation?"
        description="Sets status to in_preparation (PATCH …/status). Only available from approved."
        confirmLabel="Start preparation"
        onConfirm={() => void onStartPrep()}
      />
      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete booking?"
        description="POST …/complete. Server enforces financial review (EP1-BR-002)."
        confirmLabel="Complete"
        onConfirm={() => void onComplete()}
      />
    </div>
  );
}
