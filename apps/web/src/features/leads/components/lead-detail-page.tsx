'use client';

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
  useAssignLeadMutation,
  useChangeLeadStageMutation,
  useLeadQuery,
  useScheduleFollowUpMutation,
} from '../hooks/use-lead-queries';
import { formatBudget, formatLeadDate, formatLeadLabel } from '../lib/format';
import {
  allowedStagesFrom,
  assignLeadFormSchema,
  changeStageFormSchema,
  scheduleFollowUpFormSchema,
  type AssignLeadFormValues,
  type ChangeStageFormValues,
  type Lead,
  type ScheduleFollowUpFormValues,
} from '../schemas/lead.schemas';

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

function StagePanel({
  leadId,
  stage,
  version,
}: {
  leadId: string;
  stage: Lead['stage'];
  version: number;
}) {
  const mutation = useChangeLeadStageMutation(leadId);
  const nextStages = allowedStagesFrom(stage);
  const form = useForm<ChangeStageFormValues>({
    resolver: zodResolver(changeStageFormSchema),
    defaultValues: {
      stage: nextStages[0] ?? 'in_talks',
      lostReason: '',
      reason: '',
    },
  });

  if (nextStages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Stage is terminal ({formatLeadLabel(stage)}). No further transitions.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await mutation.mutateAsync({
              body: {
                stage: values.stage,
                ...(values.lostReason?.trim()
                  ? { lostReason: values.lostReason.trim() }
                  : {}),
                ...(values.reason?.trim() ? { reason: values.reason.trim() } : {}),
              },
              version,
            });
            toast.success('Lead stage updated');
          } catch (error) {
            toast.error(
              error instanceof ApiError ? error.message : 'Unable to change stage.',
            );
          }
        })}
      >
        <FormField
          control={form.control}
          name="stage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Next stage</FormLabel>
              <FormControl>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                  {...field}
                >
                  {nextStages.map((s) => (
                    <option key={s} value={s}>
                      {formatLeadLabel(s)}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason (optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lostReason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lost reason (if lost)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Update stage
        </Button>
      </form>
    </Form>
  );
}

function AssignPanel({ leadId, version }: { leadId: string; version: number }) {
  const mutation = useAssignLeadMutation(leadId);
  const form = useForm<AssignLeadFormValues>({
    resolver: zodResolver(assignLeadFormSchema),
    defaultValues: { staffId: '' },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await mutation.mutateAsync({
              body: { staffId: values.staffId },
              version,
            });
            toast.success('Lead assigned');
            form.reset({ staffId: '' });
          } catch (error) {
            toast.error(
              error instanceof ApiError ? error.message : 'Unable to assign lead.',
            );
          }
        })}
      >
        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Staff member ID</FormLabel>
              <FormControl>
                <Input placeholder="UUID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Phase 1 assign API requires a staff UUID. Staff picker needs staff:read (optional later).
        </p>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Assign
        </Button>
      </form>
    </Form>
  );
}

function FollowUpPanel({ leadId }: { leadId: string }) {
  const mutation = useScheduleFollowUpMutation(leadId);
  const form = useForm<ScheduleFollowUpFormValues>({
    resolver: zodResolver(scheduleFollowUpFormSchema),
    defaultValues: { dueAt: '', notes: '' },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            const due = new Date(values.dueAt);
            await mutation.mutateAsync({
              dueAt: due.toISOString(),
              ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
            });
            toast.success('Follow-up scheduled');
            form.reset({ dueAt: '', notes: '' });
          } catch (error) {
            toast.error(
              error instanceof ApiError
                ? error.message
                : 'Unable to schedule follow-up.',
            );
          }
        })}
      >
        <FormField
          control={form.control}
          name="dueAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Due at</FormLabel>
              <FormControl>
                <Input type="datetime-local" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-xs text-muted-foreground">
          Follow-ups can be created here. Listing follow-ups is not exposed by the Phase 1 API.
        </p>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Schedule follow-up
        </Button>
      </form>
    </Form>
  );
}

export function LeadDetailPage() {
  const pathname = usePathname() ?? '/app/leads/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useLeadQuery(id);
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data?.eventType ?? 'Lead',
  });

  return (
    <RequirePermission permission="leads:read">
      <PageLayout>
        <PageHeader
          title={query.data?.eventType ? String(query.data.eventType) : 'Lead'}
          description="Lead profile from GET /api/v1/leads/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/leads/">Back to list</Link>
            </Button>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing lead id"
              description="Open a lead with ?id=<uuid>."
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
              title="Unable to load lead"
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
              <ContentCard title="Lead information">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Stage" value={formatLeadLabel(query.data.stage)} />
                  <DetailField label="Source" value={formatLeadLabel(query.data.source)} />
                  <DetailField
                    label="Source detail"
                    value={query.data.sourceDetail ?? '—'}
                  />
                  <DetailField label="Event type" value={query.data.eventType ?? '—'} />
                  <DetailField
                    label="Event start"
                    value={formatLeadDate(query.data.eventStartDate)}
                  />
                  <DetailField
                    label="Event end"
                    value={formatLeadDate(query.data.eventEndDate)}
                  />
                  <DetailField label="Venue" value={query.data.venue ?? '—'} />
                  <DetailField
                    label="Budget"
                    value={formatBudget(
                      query.data.estimatedBudgetAmount,
                      query.data.estimatedBudgetCurrency,
                    )}
                  />
                  <DetailField
                    label="Guests"
                    value={
                      query.data.guestCount === null
                        ? '—'
                        : String(query.data.guestCount)
                    }
                  />
                  <DetailField
                    label="Customer ID"
                    value={query.data.customerId ?? '—'}
                  />
                  <DetailField
                    label="Assigned to"
                    value={query.data.assignedToId ?? '—'}
                  />
                  <DetailField label="Version" value={String(query.data.version)} />
                  <div className="sm:col-span-2">
                    <DetailField label="Notes" value={query.data.notes ?? '—'} />
                  </div>
                  <DetailField
                    label="Lost reason"
                    value={query.data.lostReason ?? '—'}
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <div className="grid gap-4 lg:grid-cols-3">
                <Can permission="leads:stage:update">
                  <ContentCard title="Change stage">
                    <StagePanel
                      leadId={query.data.id}
                      stage={query.data.stage}
                      version={query.data.version}
                    />
                  </ContentCard>
                </Can>
                <Can permission="leads:assign">
                  <ContentCard title="Assign lead">
                    <AssignPanel leadId={query.data.id} version={query.data.version} />
                  </ContentCard>
                </Can>
                <Can permission="leads:followups:write">
                  <ContentCard title="Schedule follow-up">
                    <FollowUpPanel leadId={query.data.id} />
                  </ContentCard>
                </Can>
              </div>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
