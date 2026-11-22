'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
  VENDOR_STATUSES,
  createVendorFormSchema,
  updateVendorFormSchema,
  type VendorFormValues,
  type VendorStatus,
} from '../schemas/vendor.schemas';
import { formatVendorStatus } from '../lib/format';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

type VendorFormProps = {
  mode: 'create' | 'edit';
  previousStatus?: VendorStatus;
  defaultValues?: VendorFormValues;
  submitLabel: string;
  onSubmit: (values: VendorFormValues) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

const emptyDefaults: VendorFormValues = {
  name: '',
  category: '',
  status: 'active',
  contactName: '',
  contactPhone: '',
  location: '',
  servicesProvided: '',
  pricingNotes: '',
  paymentTerms: '',
  taxDetails: '',
  notes: '',
  statusReason: '',
};

export function VendorForm({
  mode,
  previousStatus = 'active',
  defaultValues,
  submitLabel,
  onSubmit,
  onDirtyChange,
}: VendorFormProps) {
  const schema =
    mode === 'create'
      ? createVendorFormSchema
      : updateVendorFormSchema(previousStatus);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? emptyDefaults,
  });

  const status = useWatch({ control: form.control, name: 'status' });
  const showStatusReason =
    mode === 'edit' &&
    (status === 'paused' || status === 'blocked') &&
    status !== previousStatus;

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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input
                  placeholder="Free-text (e.g. flowers, transport)"
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
                  {VENDOR_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {formatVendorStatus(value)}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {showStatusReason ? (
          <FormField
            control={form.control}
            name="statusReason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status reason</FormLabel>
                <FormControl>
                  <Input disabled={form.formState.isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact name</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactPhone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact phone</FormLabel>
              <FormControl>
                <Input type="tel" disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="servicesProvided"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Services provided</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pricingNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pricing notes</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="paymentTerms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment terms</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="taxDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax details</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </form>
    </Form>
  );
}
