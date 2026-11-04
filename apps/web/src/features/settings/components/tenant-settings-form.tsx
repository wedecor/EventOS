'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Can, usePermissions } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
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
  ErrorState,
  LoadingState,
} from '@/shared/components/page';
import {
  useTenantSettingsQuery,
  useUpdateTenantSettingsMutation,
} from '../hooks/use-settings-queries';
import {
  settingsToFormValues,
  tenantSettingsFormSchema,
  toUpdateTenantSettingsRequest,
  type TenantSettingsFormValues,
} from '../schemas/settings.schemas';

export function TenantSettingsForm() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('settings:write');
  const query = useTenantSettingsQuery();
  const updateMutation = useUpdateTenantSettingsMutation();

  const form = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(tenantSettingsFormSchema),
    defaultValues: {
      businessName: '',
      monthlyEventTarget: '',
      monthlyRevenueTarget: '',
      monthlyLeadTarget: '',
      averageBookingTarget: '',
      conversionRateTarget: '',
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(settingsToFormValues(query.data));
    }
  }, [query.data, form]);

  const onSubmit = async (values: TenantSettingsFormValues) => {
    if (!query.data || !canWrite) return;
    try {
      const body = toUpdateTenantSettingsRequest(values);
      await updateMutation.mutateAsync({
        body,
        version: query.data.version,
      });
      toast.success('Tenant settings saved');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to save settings.',
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState variant="skeleton" rows={6} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load settings"
        description={
          query.error instanceof ApiError
            ? query.error.message
            : 'Request failed.'
        }
        onRetry={() => void query.refetch()}
      />
    );
  }

  const fieldsDisabled = form.formState.isSubmitting || !canWrite;

  return (
    <ContentCard
      title="Tenant settings"
      description="GET/PATCH /api/v1/settings — business name and selective KPI targets (EP1-KPI-007). Empty targets clear to null."
    >
      <Form {...form}>
        <form
          className="space-y-4"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input disabled={fieldsDisabled} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="monthlyEventTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly event target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">Leave blank for null</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyLeadTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly lead target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyRevenueTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly revenue target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="averageBookingTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Average booking target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conversionRateTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conversion rate target</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      disabled={fieldsDisabled}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Fraction as stored by API (e.g. 0.25), not percent
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Version {query.data?.version ?? '—'} · If-Match required on save
          </p>

          <Can permission="settings:write">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save settings'}
            </Button>
          </Can>
        </form>
      </Form>
    </ContentCard>
  );
}
