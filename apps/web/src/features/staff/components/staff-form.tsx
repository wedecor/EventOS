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
  STAFF_EMPLOYMENT_TYPES,
  STAFF_STATUSES,
  staffFormSchema,
  type StaffFormValues,
} from '../schemas/staff.schemas';
import { formatEmploymentType, formatStaffStatus } from '../lib/format';

const selectClassName =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

type StaffFormProps = {
  defaultValues?: StaffFormValues;
  submitLabel: string;
  onSubmit: (values: StaffFormValues) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

const emptyDefaults: StaffFormValues = {
  name: '',
  role: '',
  department: '',
  phoneCountryCode: '+91',
  phoneNumber: '',
  email: '',
  status: 'active',
  employmentType: 'temporary',
};

export function StaffForm({
  defaultValues,
  submitLabel,
  onSubmit,
  onDirtyChange,
}: StaffFormProps) {
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
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
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Operational role</FormLabel>
              <FormControl>
                <Input
                  placeholder="Free-text (e.g. Primary Decorator)"
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
          name="employmentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employment type</FormLabel>
              <FormControl>
                <select
                  className={selectClassName}
                  disabled={form.formState.isSubmitting}
                  value={field.value}
                  onChange={field.onChange}
                >
                  {STAFF_EMPLOYMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {formatEmploymentType(type)}
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
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department (optional)</FormLabel>
              <FormControl>
                <Input disabled={form.formState.isSubmitting} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <FormField
            control={form.control}
            name="phoneCountryCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code</FormLabel>
                <FormControl>
                  <Input disabled={form.formState.isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    disabled={form.formState.isSubmitting}
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optional)</FormLabel>
              <FormControl>
                <Input
                  type="email"
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
                  {STAFF_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStaffStatus(status)}
                    </option>
                  ))}
                </select>
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
