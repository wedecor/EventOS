import { z } from 'zod';
import type { operations } from '@/types/api.generated';

export type CreateVendorRequest =
  operations['VendorController_createVendor']['requestBody']['content']['application/json'];

export type UpdateVendorRequest =
  operations['VendorController_updateVendor']['requestBody']['content']['application/json'];

export type AddVendorIssueNoteRequest =
  operations['VendorController_addIssueNote']['requestBody']['content']['application/json'];

export const VENDOR_STATUSES = [
  'preferred',
  'active',
  'backup',
  'paused',
  'blocked',
] as const;

export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const vendorStatusSchema = z.enum(VENDOR_STATUSES);

export const vendorSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: vendorStatusSchema,
  contactName: z.string().nullable(),
  contactPhone: z.string().nullable(),
  location: z.string().nullable(),
  servicesProvided: z.string().nullable(),
  pricingNotes: z.string().nullable(),
  paymentTerms: z.string().nullable(),
  taxDetails: z.string().nullable(),
  notes: z.string().nullable(),
  procurementCount: z.number().int().nonnegative().optional().default(0),
  onTimeDeliveryCount: z.number().int().nonnegative().optional().default(0),
  completedProcurementCount: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .default(0),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const vendorListEnvelopeSchema = z.object({
  data: z.array(vendorSchema),
});

export const vendorEnvelopeSchema = z.object({
  data: vendorSchema,
});

export const vendorIssueNoteSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  vendorId: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high']),
  occurredAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export const vendorIssueNoteEnvelopeSchema = z.object({
  data: vendorIssueNoteSchema,
});

export type Vendor = z.infer<typeof vendorSchema>;
export type VendorIssueNote = z.infer<typeof vendorIssueNoteSchema>;

export type ListVendorsQuery = {
  status?: VendorStatus;
  category?: string;
};

const optionalText = z.string();

const vendorFormBaseSchema = z.object({
  name: z.string().trim().min(1, 'Vendor name is required'),
  category: z.string().trim().min(1, 'Category is required'),
  status: vendorStatusSchema,
  contactName: optionalText,
  contactPhone: optionalText,
  location: optionalText,
  servicesProvided: optionalText,
  pricingNotes: optionalText,
  paymentTerms: optionalText,
  taxDetails: optionalText,
  notes: optionalText,
  statusReason: optionalText,
});

/** Create — statusReason is PATCH-only on the API. */
export const createVendorFormSchema = vendorFormBaseSchema;

export function updateVendorFormSchema(previousStatus: VendorStatus) {
  return vendorFormBaseSchema.superRefine((value, ctx) => {
    const requiresReason =
      (value.status === 'paused' || value.status === 'blocked') &&
      value.status !== previousStatus;
    if (requiresReason && !value.statusReason.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Reason is required when changing status to paused or blocked',
        path: ['statusReason'],
      });
    }
  });
}

export type VendorFormValues = z.infer<typeof vendorFormBaseSchema>;

export const addIssueNoteFormSchema = z.object({
  message: z.string().trim().min(1, 'Message is required'),
  severity: z.enum(['low', 'medium', 'high']),
});

export type AddIssueNoteFormValues = z.infer<typeof addIssueNoteFormSchema>;

export function parseVendor(body: unknown): Vendor {
  return vendorEnvelopeSchema.parse(body).data;
}

export function parseVendorList(body: unknown): Vendor[] {
  return vendorListEnvelopeSchema.parse(body).data;
}

export function parseVendorIssueNote(body: unknown): VendorIssueNote {
  return vendorIssueNoteEnvelopeSchema.parse(body).data;
}

function optionalField(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toCreateVendorRequest(
  values: VendorFormValues,
): CreateVendorRequest {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    status: values.status,
    ...(optionalField(values.contactName)
      ? { contactName: optionalField(values.contactName) }
      : {}),
    ...(optionalField(values.contactPhone)
      ? { contactPhone: optionalField(values.contactPhone) }
      : {}),
    ...(optionalField(values.location)
      ? { location: optionalField(values.location) }
      : {}),
    ...(optionalField(values.servicesProvided)
      ? { servicesProvided: optionalField(values.servicesProvided) }
      : {}),
    ...(optionalField(values.pricingNotes)
      ? { pricingNotes: optionalField(values.pricingNotes) }
      : {}),
    ...(optionalField(values.paymentTerms)
      ? { paymentTerms: optionalField(values.paymentTerms) }
      : {}),
    ...(optionalField(values.taxDetails)
      ? { taxDetails: optionalField(values.taxDetails) }
      : {}),
    ...(optionalField(values.notes) ? { notes: optionalField(values.notes) } : {}),
  };
}

export function toUpdateVendorRequest(
  values: VendorFormValues,
): UpdateVendorRequest {
  const reason = optionalField(values.statusReason);
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    status: values.status,
    contactName: values.contactName.trim(),
    contactPhone: values.contactPhone.trim(),
    location: values.location.trim(),
    servicesProvided: values.servicesProvided.trim(),
    pricingNotes: values.pricingNotes.trim(),
    paymentTerms: values.paymentTerms.trim(),
    taxDetails: values.taxDetails.trim(),
    notes: values.notes.trim(),
    ...(reason ? { statusReason: reason } : {}),
  };
}

export function vendorToFormValues(vendor: Vendor): VendorFormValues {
  return {
    name: vendor.name,
    category: vendor.category,
    status: vendor.status,
    contactName: vendor.contactName ?? '',
    contactPhone: vendor.contactPhone ?? '',
    location: vendor.location ?? '',
    servicesProvided: vendor.servicesProvided ?? '',
    pricingNotes: vendor.pricingNotes ?? '',
    paymentTerms: vendor.paymentTerms ?? '',
    taxDetails: vendor.taxDetails ?? '',
    notes: vendor.notes ?? '',
    statusReason: '',
  };
}

export function toAddIssueNoteRequest(
  values: AddIssueNoteFormValues,
): AddVendorIssueNoteRequest {
  return {
    message: values.message.trim(),
    severity: values.severity,
  };
}
