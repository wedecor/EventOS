'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RequirePermission } from '@/features/auth';
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
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useCreateCommunicationMutation } from '../hooks/use-communication-queries';
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTIONS,
  COMMUNICATION_STATUSES,
  createCommunicationFormSchema,
  formatCommunicationLabel,
  toCreateCommunicationRequest,
  type CreateCommunicationFormValues,
} from '../schemas/communication.schemas';

const CREATE_STATUSES = COMMUNICATION_STATUSES.filter((s) =>
  ['draft', 'queued', 'completed'].includes(s),
);

export function CreateCommunicationPage() {
  const pathname = usePathname() ?? '/app/communications/new/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingIdPrefill = searchParams.get('bookingId') ?? '';
  const createMutation = useCreateCommunicationMutation();

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: 'New communication',
  });

  const form = useForm<CreateCommunicationFormValues>({
    resolver: zodResolver(createCommunicationFormSchema),
    defaultValues: {
      bookingId: bookingIdPrefill,
      customerId: '',
      vendorId: '',
      staffMemberId: '',
      templateId: '',
      channel: 'email',
      direction: 'outgoing',
      status: 'draft',
      subject: '',
      body: '',
    },
  });

  const onSubmit = async (values: CreateCommunicationFormValues) => {
    try {
      const record = await createMutation.mutateAsync(
        toCreateCommunicationRequest(values),
      );
      toast.success('Communication created');
      router.replace(
        `/app/communications/view/?id=${encodeURIComponent(record.id)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to create communication.',
      );
    }
  };

  return (
    <RequirePermission permission="communications:write">
      <PageLayout>
        <PageHeader
          title="New communication"
          description="POST /api/v1/communications — metadata only."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link
                href={
                  bookingIdPrefill
                    ? `/app/communications/?bookingId=${encodeURIComponent(bookingIdPrefill)}`
                    : '/app/communications/'
                }
              >
                Cancel
              </Link>
            </Button>
          }
        />
        <PageSection>
          <ContentCard title="Communication">
            <Form {...form}>
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="channel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          {...field}
                        >
                          {COMMUNICATION_CHANNELS.map((channel) => (
                            <option key={channel} value={channel}>
                              {formatCommunicationLabel(channel)}
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
                  name="direction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Direction</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          {...field}
                        >
                          {COMMUNICATION_DIRECTIONS.map((direction) => (
                            <option key={direction} value={direction}>
                              {formatCommunicationLabel(direction)}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial status</FormLabel>
                      <FormControl>
                        <select
                          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                          {...field}
                        >
                          {CREATE_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {formatCommunicationLabel(status)}
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional subject" />
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
                  name="vendorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional UUID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="staffMemberId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Staff member ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional UUID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Optional UUID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Body</FormLabel>
                      <FormControl>
                        <textarea
                          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          {...field}
                          placeholder="Optional message body"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
