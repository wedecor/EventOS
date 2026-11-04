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
  useBookingInvoicesQuery,
  useCreateInvoiceMutation,
  useSendInvoiceMutation,
  useVoidInvoiceMutation,
} from '../hooks/use-finance-queries';
import { formatFinanceLabel, formatMoney, formatWhen } from '../lib/format';
import {
  createInvoiceFormSchema,
  sendInvoiceFormSchema,
  toCreateInvoiceRequest,
  toSendInvoiceRequest,
  type CreateInvoiceFormValues,
  type Invoice,
  type SendInvoiceFormValues,
} from '../schemas/finance.schemas';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

type InvoicesPanelProps = {
  bookingId: string;
  customerId?: string | null;
};

export function InvoicesPanel({
  bookingId,
  customerId = '',
}: InvoicesPanelProps) {
  const query = useBookingInvoicesQuery(bookingId);
  const createMutation = useCreateInvoiceMutation(bookingId);
  const sendMutation = useSendInvoiceMutation(bookingId);
  const voidMutation = useVoidInvoiceMutation(bookingId);
  const [formOpen, setFormOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<Invoice | null>(null);
  const [voidTarget, setVoidTarget] = useState<Invoice | null>(null);

  const createForm = useForm<CreateInvoiceFormValues>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      bookingId,
      customerId: customerId ?? '',
      description: '',
      quantity: '1',
      unitPriceAmount: '',
      notes: '',
    },
  });

  const sendForm = useForm<SendInvoiceFormValues>({
    resolver: zodResolver(sendInvoiceFormSchema),
    defaultValues: { channel: 'email', recipient: '' },
  });

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'No.',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => formatFinanceLabel(row.original.status),
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      cell: ({ row }) =>
        formatMoney(row.original.totalAmount, row.original.currency),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatWhen(row.original.createdAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'draft' ? (
              <Can permission="invoices:send">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    sendForm.reset({ channel: 'email', recipient: '' });
                    setSendTarget(invoice);
                  }}
                >
                  Send
                </Button>
              </Can>
            ) : null}
            {invoice.status === 'draft' || invoice.status === 'sent' ? (
              <Can permission="invoices:void">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setVoidTarget(invoice)}
                >
                  Void
                </Button>
              </Can>
            ) : null}
          </div>
        );
      },
    },
  ];

  const onCreate = async (values: CreateInvoiceFormValues) => {
    try {
      await createMutation.mutateAsync(toCreateInvoiceRequest(values));
      toast.success('Invoice created (draft)');
      createForm.reset({
        bookingId,
        customerId: customerId ?? '',
        description: '',
        quantity: '1',
        unitPriceAmount: '',
        notes: '',
      });
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to create invoice.',
      );
    }
  };

  const onSend = async (values: SendInvoiceFormValues) => {
    if (!sendTarget) return;
    try {
      await sendMutation.mutateAsync({
        id: sendTarget.id,
        body: toSendInvoiceRequest(values),
        version: sendTarget.version,
      });
      toast.success('Invoice sent');
      setSendTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to send invoice.',
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
      toast.success('Invoice voided');
      setVoidTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to void invoice.',
      );
    }
  };

  const invoices = query.data ?? [];

  return (
    <>
      <ContentCard
        title="Invoices"
        description="GET /bookings/:id/invoices · POST /invoices · send/void with If-Match. PDF generation is not shipped."
      >
        {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load invoices"
            description={
              query.error instanceof ApiError
                ? query.error.message
                : 'Request failed.'
            }
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {query.isSuccess && invoices.length === 0 && !formOpen ? (
          <EmptyState
            title="No invoices"
            description="Create a draft invoice with at least one line item."
          />
        ) : null}
        {query.isSuccess && invoices.length > 0 ? (
          <DataTable columns={columns} data={invoices} />
        ) : null}

        <div className="mt-4">
          <Can permission="invoices:write">
            {!formOpen ? (
              <Button type="button" onClick={() => setFormOpen(true)}>
                Create invoice
              </Button>
            ) : (
              <Form {...createForm}>
                <form
                  className="space-y-3"
                  noValidate
                  onSubmit={createForm.handleSubmit(onCreate)}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={createForm.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer ID</FormLabel>
                          <FormControl>
                            <Input
                              disabled={createMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Line description</FormLabel>
                          <FormControl>
                            <Input
                              disabled={createMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              step={1}
                              disabled={createMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="unitPriceAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit price</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              disabled={createMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Input
                              disabled={createMutation.isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={createForm.control}
                    name="bookingId"
                    render={({ field }) => (
                      <input type="hidden" {...field} />
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={createMutation.isPending}>
                      Create draft
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={createMutation.isPending}
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
        title="Void invoice?"
        description="POST /invoices/:id/void with If-Match. Draft invoices also block booking completion (EP1-BR-002)."
        confirmLabel="Void"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void onVoid()}
      />

      {sendTarget ? (
        <div className="mt-4 rounded-lg border border-border p-4">
          <h4 className="mb-2 text-sm font-semibold">
            Send invoice #{sendTarget.invoiceNumber}
          </h4>
          <Form {...sendForm}>
            <form
              className="space-y-3"
              noValidate
              onSubmit={sendForm.handleSubmit(onSend)}
            >
              <FormField
                control={sendForm.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <FormControl>
                      <select
                        className={selectClassName}
                        disabled={sendMutation.isPending}
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="email">Email</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={sendForm.control}
                name="recipient"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recipient (optional)</FormLabel>
                    <FormControl>
                      <Input
                        disabled={sendMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={sendMutation.isPending}>
                  Send
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={sendMutation.isPending}
                  onClick={() => setSendTarget(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : null}
    </>
  );
}
