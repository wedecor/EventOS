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
import { useCreateMovementMutation } from '../hooks/use-inventory-queries';
import {
  createMovementFormSchema,
  toCreateMovementRequest,
  type CreateMovementFormValues,
} from '../schemas/inventory.schemas';

export function CreateMovementPage() {
  const pathname = usePathname() ?? '/app/inventory/movements/new/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingIdPrefill = searchParams.get('bookingId') ?? '';
  const createMutation = useCreateMovementMutation();

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: 'Plan movement',
  });

  const form = useForm<CreateMovementFormValues>({
    resolver: zodResolver(createMovementFormSchema),
    defaultValues: {
      bookingId: bookingIdPrefill,
      inventoryItemId: '',
      quantity: '1',
      notes: '',
    },
  });

  const onSubmit = async (values: CreateMovementFormValues) => {
    try {
      const movement = await createMutation.mutateAsync(
        toCreateMovementRequest(values),
      );
      toast.success('Movement planned');
      router.replace(
        `/app/inventory/movements/view/?id=${encodeURIComponent(movement.id)}`,
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to plan inventory movement.',
      );
    }
  };

  return (
    <RequirePermission permission="inventory:move:write">
      <PageLayout>
        <PageHeader
          title="Plan inventory movement"
          description="POST /api/v1/inventory/movements — starts in Planned."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            bookingIdPrefill ? (
              <Button asChild variant="outline">
                <Link
                  href={`/app/inventory/movements/?bookingId=${encodeURIComponent(bookingIdPrefill)}`}
                >
                  Cancel
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/app/inventory/">Cancel</Link>
              </Button>
            )
          }
        />
        <PageSection>
          <ContentCard title="Movement">
            <Form {...form}>
              <form
                className="space-y-4"
                noValidate
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="bookingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking ID</FormLabel>
                      <FormControl>
                        <Input
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
                  name="inventoryItemId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventory item ID</FormLabel>
                      <FormControl>
                        <Input
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
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={1}
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
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          disabled={form.formState.isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving…' : 'Plan movement'}
                </Button>
              </form>
            </Form>
          </ContentCard>
        </PageSection>
      </PageLayout>
    </RequirePermission>
  );
}
