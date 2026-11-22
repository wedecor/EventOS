'use client';

import { useEffect, useState } from 'react';
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
  useIntegrationSettingsQuery,
  useTestEmailMutation,
  useTestStorageMutation,
  useUpdateIntegrationSettingsMutation,
} from '../hooks/use-integrations-queries';
import {
  integrationSettingsFormSchema,
  settingsToFormValues,
  toUpdateIntegrationSettingsRequest,
  type IntegrationSettingsFormValues,
} from '../schemas/integrations.schemas';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export function IntegrationSettingsForm() {
  const { hasPermission } = usePermissions();
  const canWrite = hasPermission('settings:write');
  const query = useIntegrationSettingsQuery();
  const updateMutation = useUpdateIntegrationSettingsMutation();
  const testEmailMutation = useTestEmailMutation();
  const testStorageMutation = useTestStorageMutation();
  const [testEmailTo, setTestEmailTo] = useState('');

  const form = useForm<IntegrationSettingsFormValues>({
    resolver: zodResolver(integrationSettingsFormSchema),
    defaultValues: {
      emailProvider: 'test',
      fromName: '',
      fromEmail: '',
      smtpUser: '',
      smtpPassword: '',
      storageProvider: 'local',
      storageBucket: '',
      storageEndpoint: '',
      storageAccessKey: '',
      storageSecretKey: '',
    },
  });

  useEffect(() => {
    if (query.data) {
      form.reset(settingsToFormValues(query.data));
    }
  }, [query.data, form]);

  const onSubmit = async (values: IntegrationSettingsFormValues) => {
    if (!query.data || !canWrite) return;
    try {
      const body = toUpdateIntegrationSettingsRequest(values);
      await updateMutation.mutateAsync({
        body,
        version: query.data.version,
      });
      toast.success(
        'Integration settings saved. Connection is not claimed until a test succeeds.',
      );
      form.setValue('smtpPassword', '');
      form.setValue('storageSecretKey', '');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unable to save integration settings.',
      );
    }
  };

  const onTestEmail = async () => {
    try {
      const result = await testEmailMutation.mutateAsync(
        testEmailTo.trim() || undefined,
      );
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Email connection test failed.',
      );
    }
  };

  const onTestStorage = async () => {
    try {
      const result = await testStorageMutation.mutateAsync();
      if (result.ok) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Storage connection test failed.',
      );
    }
  };

  if (query.isLoading) {
    return <LoadingState variant="skeleton" rows={8} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load integration settings"
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
  const settings = query.data;

  return (
    <div className="space-y-6">
      <ContentCard
        title="Email provider"
        description="Secrets are write-only. Saving configuration does not mark the provider as connected."
      >
        <Form {...form}>
          <form
            className="space-y-4"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="emailProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email provider</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      disabled={fieldsDisabled}
                      {...field}
                    >
                      <option value="test">test (adapter)</option>
                      <option value="smtp">smtp</option>
                      <option value="none">none</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="fromName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From name</FormLabel>
                    <FormControl>
                      <Input disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fromEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
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
                name="smtpUser"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP user</FormLabel>
                    <FormControl>
                      <Input disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="smtpPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SMTP password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={
                          settings?.emailSecretConfigured
                            ? 'Leave blank to keep existing'
                            : 'Enter password'
                        }
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid="email-secret-mask"
                    >
                      {settings?.emailSecretConfigured
                        ? `Configured: ${settings.emailSecretMasked ?? '••••••••'}`
                        : 'No email secret configured'}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storageProvider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage provider</FormLabel>
                  <FormControl>
                    <select
                      className={selectClassName}
                      disabled={fieldsDisabled}
                      {...field}
                    >
                      <option value="local">local</option>
                      <option value="s3">s3</option>
                      <option value="none">none</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="storageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage bucket</FormLabel>
                    <FormControl>
                      <Input disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storageEndpoint"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage endpoint</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://…"
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
                name="storageAccessKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage access key</FormLabel>
                    <FormControl>
                      <Input disabled={fieldsDisabled} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storageSecretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage secret key</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="new-password"
                        placeholder={
                          settings?.storageSecretConfigured
                            ? 'Leave blank to keep existing'
                            : 'Enter secret'
                        }
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                    <p
                      className="text-xs text-muted-foreground"
                      data-testid="storage-secret-mask"
                    >
                      {settings?.storageSecretConfigured
                        ? `Configured: ${settings.storageSecretMasked ?? '••••••••'}`
                        : 'No storage secret configured'}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Can permission="settings:write">
              <Button type="submit" disabled={fieldsDisabled}>
                Save integration settings
              </Button>
            </Can>
          </form>
        </Form>
      </ContentCard>

      <ContentCard
        title="Connection tests"
        description="Tests exercise the configured provider. Acceptance is not mailbox or S3 production proof."
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Last email test:{' '}
            {settings?.lastEmailTestStatus
              ? `${settings.lastEmailTestStatus}${
                  settings.lastEmailTestAt
                    ? ` at ${settings.lastEmailTestAt}`
                    : ''
                }`
              : 'never'}
          </p>
          <p className="text-muted-foreground">
            Last storage test:{' '}
            {settings?.lastStorageTestStatus
              ? `${settings.lastStorageTestStatus}${
                  settings.lastStorageTestAt
                    ? ` at ${settings.lastStorageTestAt}`
                    : ''
                }`
              : 'never'}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">
                Test email recipient
              </span>
              <Input
                type="email"
                value={testEmailTo}
                onChange={(event) => setTestEmailTo(event.target.value)}
                placeholder="optional override"
                disabled={!canWrite}
              />
            </label>
            <Can permission="settings:write">
              <Button
                type="button"
                variant="outline"
                disabled={testEmailMutation.isPending || !canWrite}
                onClick={() => void onTestEmail()}
              >
                {testEmailMutation.isPending
                  ? 'Testing email…'
                  : 'Test email connection'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={testStorageMutation.isPending || !canWrite}
                onClick={() => void onTestStorage()}
              >
                {testStorageMutation.isPending
                  ? 'Testing storage…'
                  : 'Test storage connection'}
              </Button>
            </Can>
          </div>
        </div>
      </ContentCard>
    </div>
  );
}
