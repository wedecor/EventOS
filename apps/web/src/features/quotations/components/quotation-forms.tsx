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
  createQuotationFormSchema,
  updateQuotationFormSchema,
  type CreateQuotationFormValues,
  type UpdateQuotationFormValues,
} from '../schemas/quotation.schemas';

type CreateQuotationFormProps = {
  onSubmit: (values: CreateQuotationFormValues) => Promise<void>;
};

export function CreateQuotationForm({ onSubmit }: CreateQuotationFormProps) {
  const form = useForm<CreateQuotationFormValues>({
    resolver: zodResolver(createQuotationFormSchema),
    defaultValues: {
      leadId: '',
      customerId: '',
      validUntil: '',
      notes: '',
    },
  });

  return (
    <Form {...form}>
      <form
        className="space-y-4"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="UUID"
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
          name="leadId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead ID</FormLabel>
              <FormControl>
                <Input
                  placeholder="UUID"
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
          name="validUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valid until (optional)</FormLabel>
              <FormControl>
                <Input
                  type="date"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Creating…' : 'Create quotation'}
        </Button>
      </form>
    </Form>
  );
}

type UpdateQuotationFormProps = {
  defaultValues: UpdateQuotationFormValues;
  onSubmit: (values: UpdateQuotationFormValues) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

export function UpdateQuotationForm({
  defaultValues,
  onSubmit,
  onDirtyChange,
}: UpdateQuotationFormProps) {
  const form = useForm<UpdateQuotationFormValues>({
    resolver: zodResolver(updateQuotationFormSchema),
    defaultValues,
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
          name="validUntil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valid until</FormLabel>
              <FormControl>
                <Input
                  type="date"
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
        <FormField
          control={form.control}
          name="discountAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Discount amount</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
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
          name="taxAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax amount</FormLabel>
              <FormControl>
                <Input
                  inputMode="decimal"
                  disabled={form.formState.isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
