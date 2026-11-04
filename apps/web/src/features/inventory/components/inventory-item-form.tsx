'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/forms/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  INVENTORY_CONDITIONS,
  INVENTORY_ITEM_STATUSES,
  INVENTORY_TAXONOMIES,
  inventoryItemFormSchema,
  type InventoryItemFormValues,
} from '../schemas/inventory.schemas';
import {
  formatCondition,
  formatItemStatus,
  formatTaxonomy,
} from '../lib/format';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

type InventoryItemFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: InventoryItemFormValues;
  submitLabel: string;
  onSubmit: (values: InventoryItemFormValues) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

const emptyDefaults: InventoryItemFormValues = {
  name: '',
  sku: '',
  category: '',
  taxonomy: 'reusable',
  unit: 'pcs',
  condition: 'good',
  quantityAtJpNagar: '0',
  status: 'active',
};

export function InventoryItemForm({
  mode,
  defaultValues,
  submitLabel,
  onSubmit,
  onDirtyChange,
}: InventoryItemFormProps) {
  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: defaultValues ?? emptyDefaults,
  });

  const dirty = form.formState.isDirty;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
          form.reset(values);
        })}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SKU</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
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
                <Input
                  placeholder="Free-text (e.g. fabrics, lights)"
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
          name="taxonomy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Taxonomy</FormLabel>
              <FormControl>
                <select
                  className={selectClassName}
                  disabled={form.formState.isSubmitting}
                  value={field.value}
                  onChange={field.onChange}
                >
                  {INVENTORY_TAXONOMIES.map((value) => (
                    <option key={value} value={value}>
                      {formatTaxonomy(value)}
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
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit</FormLabel>
              <FormControl>
                <Input
                  placeholder="pcs, m, set…"
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
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <FormControl>
                <select
                  className={selectClassName}
                  disabled={form.formState.isSubmitting}
                  value={field.value}
                  onChange={field.onChange}
                >
                  {INVENTORY_CONDITIONS.map((value) => (
                    <option key={value} value={value}>
                      {formatCondition(value)}
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
          name="quantityAtJpNagar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity at JP Nagar</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === 'edit' ? (
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <select
                    className={selectClassName}
                    disabled={form.formState.isSubmitting}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    {INVENTORY_ITEM_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {formatItemStatus(value)}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
