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
  useAddLineItemMutation,
  useQuotationLineItemsQuery,
  useRemoveLineItemMutation,
  useUpdateLineItemMutation,
} from '../hooks/use-quotation-queries';
import { formatQuotationMoney } from '../lib/format';
import {
  lineItemFormSchema,
  lineItemToFormValues,
  toAddLineItemRequest,
  toUpdateLineItemRequest,
  type LineItemFormValues,
  type Quotation,
  type QuotationLineItem,
} from '../schemas/quotation.schemas';

type QuotationLineItemsPanelProps = {
  quotation: Quotation;
};

export function QuotationLineItemsPanel({
  quotation,
}: QuotationLineItemsPanelProps) {
  const query = useQuotationLineItemsQuery(quotation.id);
  const addMutation = useAddLineItemMutation(quotation.id);
  const updateMutation = useUpdateLineItemMutation(quotation.id);
  const removeMutation = useRemoveLineItemMutation(quotation.id);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuotationLineItem | null>(null);
  const [removeTarget, setRemoveTarget] = useState<QuotationLineItem | null>(
    null,
  );

  const isDraft = quotation.status === 'draft';
  const busy =
    addMutation.isPending ||
    updateMutation.isPending ||
    removeMutation.isPending;

  const form = useForm<LineItemFormValues>({
    resolver: zodResolver(lineItemFormSchema),
    defaultValues: {
      description: '',
      quantity: '1',
      unitPriceAmount: '',
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset({ description: '', quantity: '1', unitPriceAmount: '' });
    setFormOpen(true);
  };

  const openEdit = (item: QuotationLineItem) => {
    setEditing(item);
    form.reset(lineItemToFormValues(item));
    setFormOpen(true);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync({
          itemId: editing.id,
          body: toUpdateLineItemRequest(values, quotation.currency),
          version: editing.version,
        });
        toast.success('Line item updated');
      } else {
        await addMutation.mutateAsync(
          toAddLineItemRequest(values, quotation.currency),
        );
        toast.success('Line item added');
      }
      setFormOpen(false);
      setEditing(null);
      form.reset({ description: '', quantity: '1', unitPriceAmount: '' });
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to save line item.',
      );
    }
  });

  const onRemove = async () => {
    if (!removeTarget) return;
    try {
      await removeMutation.mutateAsync(removeTarget.id);
      toast.success('Line item removed');
      setRemoveTarget(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to remove line item.',
      );
    }
  };

  const columns: ColumnDef<QuotationLineItem>[] = [
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'quantity',
      header: 'Qty',
    },
    {
      id: 'unitPrice',
      header: 'Unit price',
      cell: ({ row }) =>
        formatQuotationMoney(
          row.original.unitPriceAmount,
          row.original.currency,
        ),
    },
    {
      id: 'lineTotal',
      header: 'Line total',
      cell: ({ row }) =>
        formatQuotationMoney(
          row.original.quantity * row.original.unitPriceAmount,
          row.original.currency,
        ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        isDraft ? (
          <Can permission="quotations:write">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => openEdit(row.original)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setRemoveTarget(row.original)}
              >
                Remove
              </Button>
            </div>
          </Can>
        ) : null,
    },
  ];

  return (
    <ContentCard
      title="Line items"
      description="Server-owned totals refresh after each mutation. Draft quotations only."
    >
      {isDraft ? (
        <div className="mb-4">
          <Can permission="quotations:write">
            <Button type="button" size="sm" disabled={busy} onClick={openCreate}>
              Add line
            </Button>
          </Can>
        </div>
      ) : null}

      {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}

      {query.isError ? (
        <ErrorState
          title="Unable to load line items"
          description={
            query.error instanceof ApiError
              ? query.error.message
              : 'Request failed.'
          }
        />
      ) : null}

      {query.isSuccess && query.data.length === 0 ? (
        <EmptyState
          title="No line items"
          description={
            isDraft
              ? 'Add at least one line item before sending. Totals stay at zero until lines exist.'
              : 'This quotation has no line items.'
          }
        />
      ) : null}

      {query.isSuccess && query.data.length > 0 ? (
        <DataTable columns={columns} data={query.data} />
      ) : null}

      {formOpen ? (
        <div className="mt-4 rounded-md border border-border p-4">
          <h3 className="mb-3 text-sm font-medium">
            {editing ? 'Edit line item' : 'Add line item'}
          </h3>
          <Form {...form}>
            <form className="grid gap-3 sm:grid-cols-3" onSubmit={onSubmit}>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Stage décor package" />
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
                      <Input {...field} inputMode="numeric" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitPriceAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit price ({quotation.currency})</FormLabel>
                    <FormControl>
                      <Input {...field} inputMode="decimal" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={busy}>
                  {editing ? 'Save' : 'Add'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setFormOpen(false);
                    setEditing(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="Remove line item?"
        description={
          removeTarget
            ? `Remove “${removeTarget.description}”? Quotation totals will recalculate on the server.`
            : 'Remove this line item?'
        }
        confirmLabel="Remove"
        destructive
        loading={removeMutation.isPending}
        onConfirm={() => void onRemove()}
      />
    </ContentCard>
  );
}
