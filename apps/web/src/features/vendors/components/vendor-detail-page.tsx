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
  useAddVendorIssueNoteMutation,
  useVendorQuery,
} from '../hooks/use-vendor-queries';
import { formatVendorStatus, formatVendorWhen } from '../lib/format';
import {
  addIssueNoteFormSchema,
  toAddIssueNoteRequest,
  type AddIssueNoteFormValues,
} from '../schemas/vendor.schemas';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm break-all">{value}</dd>
    </div>
  );
}

export function VendorDetailPage() {
  const pathname = usePathname() ?? '/app/vendors/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useVendorQuery(id);
  const addNoteMutation = useAddVendorIssueNoteMutation(id ?? '');
  const [noteOpen, setNoteOpen] = useState(false);

  const noteForm = useForm<AddIssueNoteFormValues>({
    resolver: zodResolver(addIssueNoteFormSchema),
    defaultValues: { message: '', severity: 'medium' },
  });

  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: query.data?.name ?? 'Vendor',
  });

  const onAddNote = async (values: AddIssueNoteFormValues) => {
    if (!id) return;
    try {
      await addNoteMutation.mutateAsync(toAddIssueNoteRequest(values));
      toast.success('Issue note added (history list is not available in the API)');
      noteForm.reset({ message: '', severity: 'medium' });
      setNoteOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to add issue note.',
      );
    }
  };

  return (
    <RequirePermission permission="vendors:read">
      <PageLayout>
        <PageHeader
          title={query.data?.name ?? 'Vendor'}
          description="Vendor profile from GET /api/v1/vendors/:id"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <div className="flex flex-wrap gap-2">
              {id ? (
                <Can permission="vendors:write">
                  <Button asChild variant="outline">
                    <Link href={`/app/vendors/edit/?id=${encodeURIComponent(id)}`}>
                      Edit
                    </Link>
                  </Button>
                </Can>
              ) : null}
              <Button asChild variant="outline">
                <Link href="/app/vendors/">Back to list</Link>
              </Button>
            </div>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing vendor id"
              description="Open a vendor with ?id=<uuid>."
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
              title="Unable to load vendor"
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
              <ContentCard title="Profile">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <DetailField label="Name" value={query.data.name} />
                  <DetailField label="Category" value={query.data.category} />
                  <DetailField
                    label="Status"
                    value={formatVendorStatus(query.data.status)}
                  />
                  <DetailField
                    label="Version"
                    value={String(query.data.version)}
                  />
                  <DetailField
                    label="Contact name"
                    value={query.data.contactName ?? '—'}
                  />
                  <DetailField
                    label="Contact phone"
                    value={query.data.contactPhone ?? '—'}
                  />
                  <DetailField
                    label="Location"
                    value={query.data.location ?? '—'}
                  />
                  <DetailField
                    label="Payment terms"
                    value={query.data.paymentTerms ?? '—'}
                  />
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Services provided"
                      value={query.data.servicesProvided ?? '—'}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Pricing notes"
                      value={query.data.pricingNotes ?? '—'}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <DetailField
                      label="Tax details"
                      value={query.data.taxDetails ?? '—'}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <DetailField label="Notes" value={query.data.notes ?? '—'} />
                  </div>
                  <DetailField
                    label="Created"
                    value={formatVendorWhen(query.data.createdAt)}
                  />
                  <DetailField
                    label="Updated"
                    value={formatVendorWhen(query.data.updatedAt)}
                  />
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Issue notes">
                <p className="mb-3 text-xs text-muted-foreground">
                  POST /vendors/:id/issue-notes is available. There is no GET
                  list for note history in the frozen API.
                </p>
                <Can permission="vendors:write">
                  {!noteOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setNoteOpen(true)}
                    >
                      Add issue note
                    </Button>
                  ) : (
                    <Form {...noteForm}>
                      <form
                        className="space-y-3"
                        noValidate
                        onSubmit={noteForm.handleSubmit(onAddNote)}
                      >
                        <FormField
                          control={noteForm.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Input
                                  disabled={addNoteMutation.isPending}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={noteForm.control}
                          name="severity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severity</FormLabel>
                              <FormControl>
                                <select
                                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                  disabled={addNoteMutation.isPending}
                                  value={field.value}
                                  onChange={field.onChange}
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={addNoteMutation.isPending}
                          >
                            Save note
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={addNoteMutation.isPending}
                            onClick={() => setNoteOpen(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  )}
                </Can>
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
