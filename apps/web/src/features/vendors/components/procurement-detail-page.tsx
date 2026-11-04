'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
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
  useApproveProcurementQuoteMutation,
  useCreateProcurementQuoteMutation,
  useCreatePurchaseOrderMutation,
  useProcurementQuery,
  useTransitionProcurementMutation,
  useUpdateProcurementDeliveryMutation,
} from '../hooks/use-vendor-queries';
import { formatWorkflowStatus } from '../schemas/procurement.schemas';

const NEXT_STATUS: Record<string, string | undefined> = {
  draft: 'quotation_requested',
  quotation_requested: 'quotation_received',
  quotation_received: 'approved',
  approved: 'purchase_ordered',
  purchase_ordered: 'vendor_confirmed',
  vendor_confirmed: 'materials_delivered',
  materials_delivered: 'completed',
};

export function ProcurementDetailPage() {
  const pathname = usePathname() ?? '/app/vendors/procurements/view/';
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const query = useProcurementQuery(id);
  const transition = useTransitionProcurementMutation();
  const delivery = useUpdateProcurementDeliveryMutation();
  const createQuote = useCreateProcurementQuoteMutation(id ?? '');
  const approveQuote = useApproveProcurementQuoteMutation(id ?? '');
  const createPo = useCreatePurchaseOrderMutation(id ?? '');
  const [quoteAmount, setQuoteAmount] = useState('');
  const crumbs = buildBreadcrumbs(pathname, {
    currentTitle: 'Procurement',
  });

  const procurement = query.data;
  const next = procurement
    ? NEXT_STATUS[procurement.workflowStatus]
    : undefined;

  return (
    <RequirePermission permission="procurements:read">
      <PageLayout>
        <PageHeader
          title="Procurement detail"
          description="Quotes, purchase orders, delivery, and cost tracking"
          breadcrumbs={<Breadcrumbs items={crumbs} />}
          actions={
            <Button asChild variant="outline">
              <Link href="/app/vendors/procurements/">Back to list</Link>
            </Button>
          }
        />

        {!id ? (
          <PageSection>
            <EmptyState
              title="Missing procurement id"
              description="Open with ?id=<uuid>."
            />
          </PageSection>
        ) : null}

        {id && query.isLoading ? (
          <PageSection>
            <LoadingState variant="skeleton" rows={5} />
          </PageSection>
        ) : null}

        {id && query.isError ? (
          <PageSection>
            <ErrorState
              title="Unable to load procurement"
              description={
                query.error instanceof ApiError
                  ? query.error.message
                  : 'Request failed.'
              }
              onRetry={() => void query.refetch()}
            />
          </PageSection>
        ) : null}

        {procurement ? (
          <>
            <PageSection>
              <ContentCard title="Status">
                <dl className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Workflow</dt>
                    <dd className="font-medium capitalize">
                      {formatWorkflowStatus(procurement.workflowStatus)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Delivery</dt>
                    <dd className="font-medium capitalize">
                      {procurement.deliveryStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Category</dt>
                    <dd>{procurement.serviceCategory ?? '—'}</dd>
                  </div>
                </dl>
                {(procurement.outstandingActions ?? []).length > 0 ? (
                  <ul className="mt-3 list-disc pl-4 text-xs text-muted-foreground">
                    {procurement.outstandingActions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                ) : null}
                <Can permission="procurement:transition">
                  <div className="mt-4 flex flex-wrap gap-2">
                    {next ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          void transition
                            .mutateAsync({
                              id: procurement.id,
                              toStatus: next,
                              version: procurement.version,
                            })
                            .then(() => toast.success('Status updated'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Unable to transition.',
                              ),
                            )
                        }
                      >
                        Advance to {formatWorkflowStatus(next)}
                      </Button>
                    ) : null}
                    {procurement.workflowStatus !== 'cancelled' &&
                    procurement.workflowStatus !== 'completed' ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          void transition
                            .mutateAsync({
                              id: procurement.id,
                              toStatus: 'cancelled',
                              version: procurement.version,
                            })
                            .then(() => toast.success('Cancelled'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Unable to cancel.',
                              ),
                            )
                        }
                      >
                        Cancel
                      </Button>
                    ) : null}
                  </div>
                </Can>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Cost summary">
                <dl className="grid gap-3 sm:grid-cols-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Estimated</dt>
                    <dd>
                      {procurement.costSummary?.estimatedCost ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Approved</dt>
                    <dd>{procurement.costSummary?.approvedCost ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Actual</dt>
                    <dd>{procurement.costSummary?.actualCost ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Variance</dt>
                    <dd>{procurement.costSummary?.variance ?? '—'}</dd>
                  </div>
                </dl>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Quotes">
                <Can permission="procurements:write">
                  <form
                    className="mb-4 flex flex-wrap gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const amount = Number(quoteAmount);
                      if (!Number.isFinite(amount)) return;
                      void createQuote
                        .mutateAsync({ amount })
                        .then(() => {
                          toast.success('Quote recorded');
                          setQuoteAmount('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to add quote.',
                          ),
                        );
                    }}
                  >
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className="flex h-9 rounded-md border border-input bg-card px-3 text-sm"
                      placeholder="Amount"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                    />
                    <Button type="submit" disabled={!quoteAmount}>
                      Add quote
                    </Button>
                  </form>
                </Can>
                <ul className="space-y-2">
                  {(procurement.quotes ?? []).map((quote) => (
                    <li
                      key={quote.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {quote.amount} {quote.currency} · {quote.status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.attachmentName
                            ? `Attachment: ${quote.attachmentName}`
                            : 'No attachment metadata'}
                        </p>
                      </div>
                      <Can permission="procurements:write">
                        {quote.status === 'submitted' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void approveQuote
                                .mutateAsync({
                                  quoteId: quote.id,
                                  version: quote.version,
                                })
                                .then(() => toast.success('Quote approved'))
                                .catch((err) =>
                                  toast.error(
                                    err instanceof ApiError
                                      ? err.message
                                      : 'Unable to approve.',
                                  ),
                                )
                            }
                          >
                            Approve
                          </Button>
                        ) : null}
                      </Can>
                    </li>
                  ))}
                </ul>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Purchase orders">
                <Can permission="procurements:write">
                  <Button
                    size="sm"
                    className="mb-3"
                    onClick={() =>
                      void createPo
                        .mutateAsync({ issue: true })
                        .then(() => toast.success('PO created'))
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to create PO.',
                          ),
                        )
                    }
                  >
                    Issue purchase order
                  </Button>
                </Can>
                <ul className="space-y-2">
                  {(procurement.purchaseOrders ?? []).map((po) => (
                    <li
                      key={po.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <p className="font-medium">
                        {po.poNumber} · {po.status}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {po.totalAmount} {po.currency}
                      </p>
                    </li>
                  ))}
                </ul>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Delivery">
                <Can permission="procurements:write">
                  <div className="mb-3 flex flex-wrap gap-2">
                    {(['pending', 'partial', 'delivered'] as const).map(
                      (status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            void delivery
                              .mutateAsync({
                                id: procurement.id,
                                version: procurement.version,
                                deliveryStatus: status,
                              })
                              .then(() => toast.success('Delivery updated'))
                              .catch((err) =>
                                toast.error(
                                  err instanceof ApiError
                                    ? err.message
                                    : 'Unable to update delivery.',
                                ),
                              )
                          }
                        >
                          Mark {status}
                        </Button>
                      ),
                    )}
                  </div>
                </Can>
                <p className="text-sm text-muted-foreground">
                  Current: {procurement.deliveryStatus}
                  {procurement.deliveryNotes
                    ? ` · ${procurement.deliveryNotes}`
                    : ''}
                </p>
              </ContentCard>
            </PageSection>

            <PageSection>
              <ContentCard title="Timeline">
                <ul className="space-y-2">
                  {(procurement.timeline ?? []).map((event) => (
                    <li
                      key={event.id}
                      className="rounded-md border border-border p-3 text-sm"
                    >
                      <p className="font-medium">{event.message}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {event.eventType.replace(/_/g, ' ')}
                      </p>
                    </li>
                  ))}
                </ul>
              </ContentCard>
            </PageSection>
          </>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
