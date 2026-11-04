import { z } from 'zod';
import type { operations } from '@/types/api.generated';

/**
 * OpenAPI request bodies for Customer (clients) endpoints.
 * Response `data` is under-specified in openapi.v1.json — validated via Zod below.
 */
export type CreateCustomerRequest =
  operations['CustomerController_createCustomer']['requestBody']['content']['application/json'];

export type UpdateCustomerRequest =
  operations['CustomerController_updateCustomer']['requestBody']['content']['application/json'];

/** Runtime customer profile (mirrors CustomerDto JSON). */
export const customerSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  displayName: z.string().min(1),
  type: z.string().min(1),
  status: z.string().min(1),
  primaryPhone: z.string().nullable(),
  primaryEmail: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const customerEnvelopeSchema = z.object({
  data: customerSchema,
});

export type Customer = z.infer<typeof customerSchema>;

/**
 * Form fields that the application layer actually persists.
 * OpenAPI also lists `company` / `address`, but the Phase 1 service ignores them —
 * do not collect them in the UI (documented limitation).
 */
export const customerFormSchema = z
  .object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string(),
    phone: z.string(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    const email = value.email.trim();
    const phone = value.phone.trim();
    if (email) {
      const emailCheck = z.string().email().safeParse(email);
      if (!emailCheck.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'Enter a valid email',
          path: ['email'],
        });
      }
    }
    // Mirrors CustomerApplicationService: at least one phone or email.
    if (!email && !phone) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide at least one phone or email.',
        path: ['email'],
      });
      ctx.addIssue({
        code: 'custom',
        message: 'Provide at least one phone or email.',
        path: ['phone'],
      });
    }
  });

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function parseCustomer(body: unknown): Customer {
  return customerEnvelopeSchema.parse(body).data;
}

export function toCreateRequest(values: CustomerFormValues): CreateCustomerRequest {
  const email = values.email?.trim();
  const phone = values.phone?.trim();
  return {
    name: values.name.trim(),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
  };
}

export function toUpdateRequest(values: CustomerFormValues): UpdateCustomerRequest {
  return toCreateRequest(values);
}

export function customerToFormValues(customer: Customer): CustomerFormValues {
  return {
    name: customer.displayName,
    email: customer.primaryEmail ?? '',
    phone: customer.primaryPhone ?? '',
    notes: customer.notes ?? '',
  };
}
