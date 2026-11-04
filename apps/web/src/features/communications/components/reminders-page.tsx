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
  useCancelReminderMutation,
  useCompleteReminderMutation,
  useCreateReminderMutation,
  useRemindersQuery,
} from '../hooks/use-communication-queries';
import {
  REMINDER_CATEGORIES,
  createReminderFormSchema,
  formatCommunicationLabel,
  formatWhen,
  toCreateReminderRequest,
  type CreateReminderFormValues,
} from '../schemas/communication.schemas';

export function RemindersPage() {
  const pathname = usePathname() ?? '/app/communications/reminders/';
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: bookingId ? 'Booking reminders' : 'Reminders',
  });
  const query = useRemindersQuery(bookingId);
  const createMutation = useCreateReminderMutation();
  const completeMutation = useCompleteReminderMutation();
  const cancelMutation = useCancelReminderMutation();

  const form = useForm<CreateReminderFormValues>({
    resolver: zodResolver(createReminderFormSchema),
    defaultValues: {
      bookingId: bookingId ?? '',
      customerId: '',
      vendorId: '',
      staffMemberId: '',
      communicationRecordId: '',
      category: 'other',
      title: '',
      notes: '',
      dueAt: '',
      assignedToUserId: '',
    },
  });

  const onCreate = async (values: CreateReminderFormValues) => {
    try {
      await createMutation.mutateAsync(toCreateReminderRequest(values));
      toast.success('Reminder created');
      form.reset({
        bookingId: bookingId ?? '',
        customerId: '',
        vendorId: '',
        staffMemberId: '',
        communicationRecordId: '',
        category: 'other',
        title: '',
        notes: '',
        dueAt: '',
        assignedToUserId: '',
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to create reminder.',
      );
    }
  };

  return (
    <RequirePermission permission="reminders:read">
      <PageLayout>
        <PageHeader
          title="Reminders"
          description="Follow-ups tied to bookings, customers, and communications."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {bookingId ? (
                <Button asChild variant="outline">
                  <Link
                    href={`/app/communications/?bookingId=${encodeURIComponent(bookingId)}`}
                  >
                    Booking communications
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/communications/">Communications</Link>
              </Button>
            </div>
          }
        />

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load reminders"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          ) : null}
          {!query.isLoading &&
          !query.isError &&
          (query.data ?? []).length === 0 ? (
            <EmptyState
              title="No reminders"
              description="Create a follow-up reminder below."
            />
          ) : null}
          {(query.data ?? []).length > 0 ? (
            <ContentCard
              title="Reminders"
              description={
                bookingId
                  ? `Scoped to booking ${bookingId}`
                  : `${(query.data ?? []).length} total`
              }
            >
              <ul className="space-y-2">
                {(query.data ?? []).map((reminder) => (
                  <li
                    key={reminder.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {reminder.title} ·{' '}
                        {formatCommunicationLabel(reminder.status)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCommunicationLabel(reminder.category)} · Due{' '}
                        {formatWhen(reminder.dueAt)}
                        {reminder.bookingId
                          ? ` · Booking ${reminder.bookingId.slice(0, 8)}`
                          : ''}
                      </p>
                      {reminder.notes ? (
                        <p className="mt-1 text-xs">{reminder.notes}</p>
                      ) : null}
                    </div>
                    {reminder.status === 'pending' ? (
                      <div className="flex flex-wrap gap-2">
                        <Can permission="reminders:write">
                          <Button
                            type="button"
                            size="sm"
                            disabled={completeMutation.isPending}
                            onClick={() =>
                              void completeMutation
                                .mutateAsync({
                                  id: reminder.id,
                                  version: reminder.version,
                                })
                                .then(() => toast.success('Reminder completed'))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof ApiError
                                      ? err.message
                                      : 'Complete failed',
                                  ),
                                )
                            }
                          >
                            Complete
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={cancelMutation.isPending}
                            onClick={() =>
                              void cancelMutation
                                .mutateAsync({
                                  id: reminder.id,
                                  version: reminder.version,
                                })
                                .then(() => toast.success('Reminder cancelled'))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof ApiError
                                      ? err.message
                                      : 'Cancel failed',
                                  ),
                                )
                            }
                          >
                            Cancel
                          </Button>
                        </Can>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ContentCard>
          ) : null}
        </PageSection>

        <PageSection>
          <Can permission="reminders:write">
            <ContentCard title="Create reminder">
              <Form {...form}>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={form.handleSubmit(onCreate)}
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            {...field}
                          >
                            {REMINDER_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {formatCommunicationLabel(category)}
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
                    name="dueAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due at</FormLabel>
                        <FormControl>
                          <Input {...field} type="datetime-local" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bookingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Booking ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional UUID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional UUID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="communicationRecordId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional UUID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assignedToUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignee user ID</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional UUID" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <textarea
                            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending
                        ? 'Creating…'
                        : 'Create reminder'}
                    </Button>
                  </div>
                </form>
              </Form>
            </ContentCard>
          </Can>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
