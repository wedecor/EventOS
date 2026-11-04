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
  useBookingExpensesQuery,
  useRecordExpenseMutation,
  useVoidExpenseMutation,
} from '../hooks/use-finance-queries';
import { formatFinanceLabel, formatMoney, formatWhen } from '../lib/format';
import {
  PAYMENT_METHODS,
  defaultDateTimeLocalValue,
  recordExpenseFormSchema,
  toRecordExpenseRequest,
  type Expense,
  type RecordExpenseFormValues,
} from '../schemas/finance.schemas';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

type ExpensesPanelProps = {
  bookingId: string;
};

export function ExpensesPanel({ bookingId }: ExpensesPanelProps) {
  const query = useBookingExpensesQuery(bookingId);
  const recordMutation = useRecordExpenseMutation(bookingId);
  const voidMutation = useVoidExpenseMutation(bookingId);
  const [formOpen, setFormOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState<Expense | null>(null);

  const form = useForm<RecordExpenseFormValues>({
    resolver: zodResolver(recordExpenseFormSchema),
    defaultValues: {
      vendorId: '',
      procurementLineId: '',
      amount: '',
      currency: 'INR',
      method: 'upi',
      paidAt: defaultDateTimeLocalValue(),
      notes: '',
    },
  });

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'vendorId',
      header: 'Vendor',
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.vendorId}</span>
      ),
    },
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
      accessorKey: 'paidAt',
      header: 'Paid',
      cell: ({ row }) => formatWhen(row.original.paidAt),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        row.original.status !== 'void' ? (
          <Can permission="expenses:void">
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

  const onRecord = async (values: RecordExpenseFormValues) => {
    try {
      await recordMutation.mutateAsync(toRecordExpenseRequest(values));
      toast.success('Expense recorded');
      form.reset({
        vendorId: '',
        procurementLineId: '',
        amount: '',
        currency: 'INR',
        method: 'upi',
        paidAt: defaultDateTimeLocalValue(),
        notes: '',
      });
      setFormOpen(false);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to record expense.',
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
      toast.success('Expense voided');
      setVoidTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : 'Unable to void expense.',
      );
    }
  };

  const expenses = query.data ?? [];

  return (
    <>
      <ContentCard
        title="Vendor expenses"
        description="GET/POST /bookings/:id/expenses · POST /expenses/:id/void. Proof upload is not shipped."
      >
        {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
        {query.isError ? (
          <ErrorState
            title="Unable to load expenses"
            description={
              query.error instanceof ApiError
                ? query.error.message
                : 'Request failed.'
            }
            onRetry={() => void query.refetch()}
          />
        ) : null}
        {query.isSuccess && expenses.length === 0 && !formOpen ? (
          <EmptyState
            title="No expenses"
            description="Record a vendor expense linked to this booking."
          />
        ) : null}
        {query.isSuccess && expenses.length > 0 ? (
          <DataTable columns={columns} data={expenses} />
        ) : null}

        <div className="mt-4">
          <Can permission="expenses:write">
            {!formOpen ? (
              <Button type="button" onClick={() => setFormOpen(true)}>
                Record expense
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
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor ID</FormLabel>
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
                      name="procurementLineId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Procurement line ID (optional)</FormLabel>
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
                      name="paidAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paid at</FormLabel>
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
                  <div className="flex gap-2">
                    <Button type="submit" disabled={recordMutation.isPending}>
                      Save expense
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
        title="Void expense?"
        description="POST /expenses/:id/void with If-Match."
        confirmLabel="Void"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void onVoid()}
      />
    </>
  );
}
