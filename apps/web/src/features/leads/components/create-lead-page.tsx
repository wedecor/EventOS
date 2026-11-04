'use client';

import { usePathname, useRouter } from 'next/navigation';
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
import { ContentCard, PageHeader, PageLayout, PageSection } from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { useCreateLeadMutation } from '../hooks/use-lead-queries';
import {
  createLeadFormSchema,
  LEAD_SOURCES,
  toCreateLeadRequest,
  type CreateLeadFormValues,
} from '../schemas/lead.schemas';

export function CreateLeadPage() {
  const pathname = usePathname() ?? '/app/leads/new/';
  const router = useRouter();
  const createMutation = useCreateLeadMutation();
  const crumbs = buildBreadcrumbs(pathname, { currentTitle: 'New lead' });
  const form = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadFormSchema),
    defaultValues: {
      source: 'manual',
      sourceDetail: '',
      eventType: '',
      eventStart: '',
      eventEnd: '',
      venue: '',
      estimatedBudgetAmount: '',
      guestCount: '',
      notes: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const lead = await createMutation.mutateAsync(toCreateLeadRequest(values));
      toast.success('Lead created');
      router.replace(`/app/leads/view/?id=${encodeURIComponent(lead.id)}`);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to create lead.',
      );
    }
  });

  return (
    <RequirePermission permission="leads:write">
      <PageLayout>
        <PageHeader
          title="New lead"
          description="Creates a lead via POST /api/v1/leads."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />
        <PageSection>
          <ContentCard title="Enquiry">
            <Form {...form}>
              <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={onSubmit}>
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        >
                          {LEAD_SOURCES.map((source) => (
                            <option key={source} value={source}>
                              {source}
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
                  name="sourceDetail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source detail</FormLabel>
                      <FormControl>
                        <Input disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event type</FormLabel>
                      <FormControl>
                        <Input disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event start</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eventEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event end</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedBudgetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated budget (INR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest count</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
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
                        <Input disabled={form.formState.isSubmitting} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Creating…' : 'Create lead'}
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
