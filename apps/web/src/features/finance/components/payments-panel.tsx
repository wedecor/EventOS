'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { DataTable } from '@/shared/components/data-display/data-table';
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
} from '@/shared/components/page';
import {
  useBookingPaymentsQuery,
  useLeadPaymentsQuery,
  useQuotationPaymentsQuery,
  useRecordPaymentMutation,
  useVoidPaymentMutation,
} from '../hooks/use-finance-queries';
import { formatFinanceLabel, formatMoney, formatWhen } from '../lib/format';
import {
  PAYMENT_METHODS,
  defaultDateTimeLocalValue,
  recordPaymentFormSchema,
  toRecordPaymentRequest,
  type Payment,
  type RecordPaymentFormValues,
} from '../schemas/finance.schemas';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

export type PaymentsPanelProps =
  | { bookingId: string; leadId?: never; quotationId?: never }
  | { leadId: string; bookingId?: never; quotationId?: never }
  | { quotationId: string; bookingId?: never; leadId?: never };

export function PaymentsPanel(props: PaymentsPanelProps) {
  const bookingId = 'bookingId' in props ? props.bookingId : undefined;
  const leadId = 'leadId' in props ? props.leadId : undefined;
  const quotationId = 'quotationId' in props ? props.quotationId : undefined;

  const bookingQuery = useBookingPaymentsQuery(bookingId);
  const leadQuery = useLeadPaymentsQuery(leadId);
  const quotationQuery = useQuotationPaymentsQuery(quotationId);
  const query = bookingId
    ? bookingQuery
    : leadId
      ? leadQuery
      : quotationQuery;

  const scope = { bookingId, leadId, quotationId };
  const recordMutation = useRecordPaymentMutation(scope);
  const voidMutation = useVoidPaymentMutation(scope);
  const [formOpen, setFormOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Payment | null>(null);

  const confirmedAdvance = (query.data ?? []).some(
    (payment) => payment.status === 'confirmed' && payment.amount > 0,
  );

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      bookingId: bookingId ?? '',
      leadId: leadId ?? '',
      quotationId: quotationId ?? '',
      invoiceId: '',
      amount: '',
      currency: 'INR',
      method: 'upi',
      receivedAt: defaultDateTimeLocalValue(),
      missingProofReason: '',
      notes: '',
    },
  });

  const columns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) =>
        formatMoney(row.original.amount, row.original.currency),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => formatFinanceLabel(row.original.method),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => formatFinanceLabel(row.original.status),
    },
    {
      accessorKey: 'receivedAt',
      header: 'Received',
      cell: ({ row }) => formatWhen(row.original.receivedAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status !== 'void' ? (
          <Can permission="payments:void">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setVoidTarget(row.original)}
            >
              Void
            </Button>
          </Can>
        ) : null,
    },
  ];

  const resetDefaults = (): RecordPaymentFormValues => ({
    bookingId: bookingId ?? '',
    leadId: leadId ?? '',
    quotationId: quotationId ?? '',
    invoiceId: '',
    amount: '',
    currency: 'INR',
    method: 'upi',
    receivedAt: defaultDateTimeLocalValue(),
    missingProofReason: '',
    notes: '',
  });

  const onRecord = async (values: RecordPaymentFormValues) => {
    try {
      await recordMutation.mutateAsync(toRecordPaymentRequest(values));
      toast.success('Payment recorded');
      form.reset(resetDefaults());
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to record payment.',
      );
    }
  };

  const onVoid = async () => {
    if (!voidTarget) return;
    try {
      await voidMutation.mutateAsync({
        id: voidTarget.id,
        version: voidTarget.version,
      });
      toast.success('Payment voided');
      setVoidTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to void payment.',
      );
    }
  };

  const payments = query.data ?? [];
  const anchorLabel = bookingId
    ? 'booking'
    : leadId
      ? 'lead'
      : 'quotation';

  return (
    <>
      <ContentCard
        title="Payments"
        description={`Record payments against this ${anchorLabel}. Confirmed amounts satisfy the advance gate for booking conversion when linked to a lead or quotation.`}
      >
        {!bookingId ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Advance status:{' '}
            <span className="font-medium text-foreground">
              {confirmedAdvance ? 'Confirmed advance on file' : 'No confirmed advance yet'}
            </span>
          </p>
        ) : null}

        {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load payments"
            description={
              query.error instanceof ApiError
                ? query.error.message
                : 'Request failed.'
            }
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {query.isSuccess && payments.length === 0 && !formOpen ? (
          <EmptyState
            title="No payments"
            description={`Record an advance or balance payment for this ${anchorLabel}.`}
          />
        ) : null}
        {query.isSuccess && payments.length > 0 ? (
          <DataTable columns={columns} data={payments} />
        ) : null}

        <div className="mt-4">
          <Can permission="payments:record">
            {!formOpen ? (
              <Button type="button" onClick={() => setFormOpen(true)}>
                Record payment
              </Button>
            ) : (
              <Form {...form}>
                <form
                  className="space-y-3"
                  noValidate
                  onSubmit={form.handleSubmit(onRecord)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={recordMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input
                              disabled={recordMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Method</FormLabel>
                          <FormControl>
                            <select
                              className={selectClassName}
                              disabled={recordMutation.isPending}
                              value={field.value}
                              onChange={field.onChange}
                            >
                              {PAYMENT_METHODS.map((method) => (
                                <option key={method} value={method}>
                                  {formatFinanceLabel(method)}
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
                      name="receivedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Received at</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              disabled={recordMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="missingProofReason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Missing proof reason</FormLabel>
                          <FormControl>
                            <Input
                              disabled={recordMutation.isPending}
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
                            <Input
                              disabled={recordMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="bookingId"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="leadId"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="quotationId"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={recordMutation.isPending}>
                      Save payment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={recordMutation.isPending}
                      onClick={() => setFormOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </Can>
        </div>
      </ContentCard>

      <ConfirmDialog
        open={Boolean(voidTarget)}
        onOpenChange={(open) => {
          if (!open) setVoidTarget(null);
        }}
        title="Void payment?"
        description="This marks the payment void via POST /payments/:id/void with If-Match."
        confirmLabel="Void"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void onVoid()}
      />
    </>
  );
}
