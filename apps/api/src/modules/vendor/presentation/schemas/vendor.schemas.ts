import { z } from 'zod';

// EP1-VEN-001 — Vendor Status Model (`docs/business/07-vendor-management.md` §11A): explicit
// 5-value status field (Preferred/Active/Backup/Paused/Blocked), superseding the simplified
// `active|inactive` placeholder in `docs/09-api-design.md` §Module: Vendor Procurement (documented
// as drift in the implementation report — business doc + domain model outrank api-design).
const vendorStatusSchema = z.enum([
  'preferred',
  'active',
  'backup',
  'paused',
  'blocked',
]);

export const createVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required.'),
  category: z.string().min(1, 'Vendor category is required.'),
  status: vendorStatusSchema.optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  servicesProvided: z.string().optional(),
  pricingNotes: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxDetails: z.string().optional(),
  notes: z.string().optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  status: vendorStatusSchema.optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  location: z.string().optional(),
  servicesProvided: z.string().optional(),
  pricingNotes: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxDetails: z.string().optional(),
  notes: z.string().optional(),
  // Required by the application service when `status` moves to `paused`/`blocked`.
  statusReason: z.string().optional(),
});

export const listVendorsQuerySchema = z.object({
  status: vendorStatusSchema.optional(),
  category: z.string().optional(),
});

export const addVendorIssueNoteSchema = z.object({
  message: z.string().min(1, 'Issue note message is required.'),
  severity: z.enum(['low', 'medium', 'high']),
  occurredAt: z.string().datetime().optional(),
});

export type CreateVendorBody = z.infer<typeof createVendorSchema>;
export type UpdateVendorBody = z.infer<typeof updateVendorSchema>;
export type ListVendorsQuery = z.infer<typeof listVendorsQuerySchema>;
export type AddVendorIssueNoteBody = z.infer<typeof addVendorIssueNoteSchema>;
