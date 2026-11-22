'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  useArchiveTemplateMutation,
  useCommunicationTemplatesQuery,
  useCreateTemplateMutation,
} from '../hooks/use-communication-queries';
import {
  COMMUNICATION_CHANNELS,
  createTemplateFormSchema,
  formatCommunicationLabel,
  formatWhen,
  toCreateTemplateRequest,
  type CreateTemplateFormValues,
} from '../schemas/communication.schemas';

export function TemplatesPage() {
  const pathname = usePathname() ?? '/app/communications/templates/';
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: 'Templates',
  });
  const query = useCommunicationTemplatesQuery();
  const createMutation = useCreateTemplateMutation();
  const archiveMutation = useArchiveTemplateMutation();

  const form = useForm<CreateTemplateFormValues>({
    resolver: zodResolver(createTemplateFormSchema),
    defaultValues: {
      name: '',
      category: '',
      channel: '',
      subject: '',
      body: '',
    },
  });

  const onCreate = async (values: CreateTemplateFormValues) => {
    try {
      await createMutation.mutateAsync(toCreateTemplateRequest(values));
      toast.success('Template created');
      form.reset({
        name: '',
        category: '',
        channel: '',
        subject: '',
        body: '',
      });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to create template.',
      );
    }
  };

  return (
    <RequirePermission permission="communication-templates:read">
      <PageLayout>
        <PageHeader
          title="Communication templates"
          description="Reusable message templates by channel and category."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/communications/">Communications</Link>
            </Button>
          }
        />

        <PageSection>
          {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
          {query.isError ? (
            <ErrorState
              title="Unable to load templates"
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
              title="No templates yet"
              description="Create a reusable template below."
            />
          ) : null}
          {(query.data ?? []).length > 0 ? (
            <ContentCard title="Templates">
              <ul className="space-y-2">
                {(query.data ?? []).map((template) => (
                  <li
                    key={template.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {template.name} ·{' '}
                        {formatCommunicationLabel(template.status)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {template.category}
                        {template.channel
                          ? ` · ${formatCommunicationLabel(template.channel)}`
                          : ''}
                        {' · '}
                        {formatWhen(template.updatedAt)}
                      </p>
                      {template.subject ? (
                        <p className="mt-1 text-xs">{template.subject}</p>
                      ) : null}
                    </div>
                    {template.status === 'active' ? (
                      <Can permission="communication-templates:write">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={archiveMutation.isPending}
                          onClick={() =>
                            void archiveMutation
                              .mutateAsync({
                                id: template.id,
                                version: template.version,
                              })
                              .then(() => toast.success('Template archived'))
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError
                                    ? err.message
                                    : 'Archive failed',
                                ),
                              )
                          }
                        >
                          Archive
                        </Button>
                      </Can>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ContentCard>
          ) : null}
        </PageSection>

        <PageSection>
          <Can permission="communication-templates:write">
            <ContentCard title="Create template">
              <Form {...form}>
                <form
                  className="grid gap-4 sm:grid-cols-2"
                  onSubmit={form.handleSubmit(onCreate)}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                          <Input {...field} placeholder="e.g. follow_up" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <option value="">Any</option>
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
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Optional" />
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? 'Creating…' : 'Create template'}
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
