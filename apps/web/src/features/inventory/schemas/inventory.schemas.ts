import { z } from 'zod';
import type { operations } from '@/types/api.generated';
import { ApiError } from '@/shared/types/api';

export type CreateInventoryItemRequest =
  operations['InventoryItemController_createItem']['requestBody']['content']['application/json'];

export type UpdateInventoryItemRequest =
  operations['InventoryItemController_updateItem']['requestBody']['content']['application/json'];

export type CreateInventoryMovementRequest =
  operations['InventoryMovementController_createMovement']['requestBody']['content']['application/json'];

export type TransitionInventoryMovementRequest =
  operations['InventoryMovementController_transitionMovement']['requestBody']['content']['application/json'];

export type AddDamageNoteRequest =
  operations['InventoryMovementController_addDamageNote']['requestBody']['content']['application/json'];

export const INVENTORY_TAXONOMIES = [
  'reusable',
  'consumable',
  'per_event',
] as const;

export const INVENTORY_CONDITIONS = [
  'good',
  'fair',
  'damaged',
  'retired',
] as const;

export const INVENTORY_ITEM_STATUSES = [
  'active',
  'inactive',
  'retired',
] as const;

export const MOVEMENT_STATUSES = [
  'planned',
  'picked',
  'packing_started',
  'packed',
  'verified',
  'ready_for_dispatch',
  'loaded',
  'dispatched',
  'at_venue',
  'returned',
  'return_verified',
  'cleaned_ready',
  'cancelled',
] as const;

/** Preferred next step along the P2-07 operational path (Phase 1 shortcuts still API-valid). */
export const NEXT_MOVEMENT_STATUS: Record<
  (typeof MOVEMENT_STATUSES)[number],
  (typeof MOVEMENT_STATUSES)[number] | null
> = {
  planned: 'picked',
  picked: 'packing_started',
  packing_started: 'packed',
  packed: 'verified',
  verified: 'ready_for_dispatch',
  ready_for_dispatch: 'loaded',
  loaded: 'dispatched',
  dispatched: 'at_venue',
  at_venue: 'returned',
  returned: 'return_verified',
  return_verified: 'cleaned_ready',
  cleaned_ready: null,
  cancelled: null,
};

export const RESERVATION_STATUSES = [
  'reserved',
  'released',
  'cancelled',
] as const;

export const DAMAGE_TYPES = [
  'breakage',
  'loss',
  'water_damage',
  'wear',
  'other',
] as const;

export const DAMAGE_SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type InventoryTaxonomy = (typeof INVENTORY_TAXONOMIES)[number];
export type InventoryCondition = (typeof INVENTORY_CONDITIONS)[number];
export type InventoryItemStatus = (typeof INVENTORY_ITEM_STATUSES)[number];
export type MovementStatus = (typeof MOVEMENT_STATUSES)[number];
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];
export type DamageType = (typeof DAMAGE_TYPES)[number];
export type DamageSeverity = (typeof DAMAGE_SEVERITIES)[number];

export const inventoryTaxonomySchema = z.enum(INVENTORY_TAXONOMIES);
export const inventoryConditionSchema = z.enum(INVENTORY_CONDITIONS);
export const inventoryItemStatusSchema = z.enum(INVENTORY_ITEM_STATUSES);
export const movementStatusSchema = z.enum(MOVEMENT_STATUSES);
export const reservationStatusSchema = z.enum(RESERVATION_STATUSES);
export const damageTypeSchema = z.enum(DAMAGE_TYPES);
export const damageSeveritySchema = z.enum(DAMAGE_SEVERITIES);

export const inventoryItemSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  sku: z.string().nullable(),
  category: z.string().min(1),
  taxonomy: inventoryTaxonomySchema,
  unit: z.string().min(1),
  condition: inventoryConditionSchema,
  quantityAtJpNagar: z.number().int().nonnegative(),
  status: inventoryItemStatusSchema,
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const inventoryItemListEnvelopeSchema = z.object({
  data: z.array(inventoryItemSchema),
});

export const inventoryItemEnvelopeSchema = z.object({
  data: inventoryItemSchema,
});

export const inventoryMovementSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  reservationId: z.string().nullable().optional(),
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  status: movementStatusSchema,
  packedByUserId: z.string().nullable().optional(),
  packingStartedAt: z.union([z.string(), z.date()]).nullable().optional(),
  verificationNotes: z.string().nullable().optional(),
  verifiedAt: z.union([z.string(), z.date()]).nullable().optional(),
  readyForDispatchAt: z.union([z.string(), z.date()]).nullable().optional(),
  vehicle: z.string().nullable().optional(),
  driverName: z.string().nullable().optional(),
  dispatchedAt: z.union([z.string(), z.date()]).nullable().optional(),
  returnedQuantity: z.number().int().nullable().optional(),
  missingQuantity: z.number().int().nullable().optional(),
  damagedQuantity: z.number().int().nullable().optional(),
  returnVerificationNotes: z.string().nullable().optional(),
  returnVerifiedAt: z.union([z.string(), z.date()]).nullable().optional(),
  pickedAt: z.union([z.string(), z.date()]).nullable(),
  packedAt: z.union([z.string(), z.date()]).nullable(),
  loadedAt: z.union([z.string(), z.date()]).nullable(),
  atVenueAt: z.union([z.string(), z.date()]).nullable(),
  returnedAt: z.union([z.string(), z.date()]).nullable(),
  cleanedReadyAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const inventoryMovementListEnvelopeSchema = z.object({
  data: z.array(inventoryMovementSchema),
});

export const inventoryMovementEnvelopeSchema = z.object({
  data: inventoryMovementSchema,
});

export const inventoryReservationSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  bookingId: z.string().min(1),
  inventoryItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  status: reservationStatusSchema,
  notes: z.string().nullable(),
  vendorProcurementId: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
  version: z.number().int().nonnegative(),
});

export const inventoryReservationListEnvelopeSchema = z.object({
  data: z.array(inventoryReservationSchema),
});

export const inventoryReservationEnvelopeSchema = z.object({
  data: inventoryReservationSchema,
});

export const inventoryVerificationSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  movementId: z.string().min(1),
  bookingId: z.string().min(1),
  expectedQuantity: z.number().int(),
  actualQuantity: z.number().int(),
  difference: z.number().int(),
  result: z.enum(['pass', 'fail', 'partial']),
  notes: z.string().nullable(),
  verifiedAt: z.union([z.string(), z.date()]),
  verifiedByUserId: z.string().nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export const inventoryVerificationListEnvelopeSchema = z.object({
  data: z.array(inventoryVerificationSchema),
});

export const inventoryVerificationEnvelopeSchema = z.object({
  data: inventoryVerificationSchema,
});

export const inventoryDamageReportSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  movementId: z.string().min(1),
  bookingId: z.string().min(1),
  inventoryItemId: z.string().nullable(),
  damageType: damageTypeSchema,
  severity: damageSeveritySchema,
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  photoName: z.string().nullable(),
  photoMimeType: z.string().nullable(),
  photoSizeBytes: z.number().int().nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export const inventoryDamageReportListEnvelopeSchema = z.object({
  data: z.array(inventoryDamageReportSchema),
});

export const inventoryDamageReportEnvelopeSchema = z.object({
  data: inventoryDamageReportSchema,
});

export const damageNoteSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  movementId: z.string().min(1),
  message: z.string().min(1),
  accountability: z.string().nullable(),
  occurredAt: z.union([z.string(), z.date()]).nullable(),
  createdAt: z.union([z.string(), z.date()]),
});

export const damageNoteEnvelopeSchema = z.object({
  data: damageNoteSchema,
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
export type InventoryReservation = z.infer<typeof inventoryReservationSchema>;
export type InventoryVerification = z.infer<typeof inventoryVerificationSchema>;
export type InventoryDamageReport = z.infer<typeof inventoryDamageReportSchema>;
export type DamageNote = z.infer<typeof damageNoteSchema>;

export type CreateInventoryReservationRequest = {
  bookingId: string;
  inventoryItemId: string;
  quantity: number;
  notes?: string;
  vendorProcurementId?: string;
};

export type ModifyInventoryReservationRequest = {
  quantity?: number;
  notes?: string;
};

export type CreateInventoryVerificationRequest = {
  expectedQuantity: number;
  actualQuantity: number;
  notes?: string;
  verifiedAt?: string;
};

export type CreateInventoryDamageReportRequest = {
  damageType: DamageType;
  severity?: DamageSeverity;
  quantity: number;
  notes?: string;
  photoName?: string;
  photoMimeType?: string;
  photoSizeBytes?: number;
};

export type ListInventoryItemsQuery = {
  status?: InventoryItemStatus;
  taxonomy?: InventoryTaxonomy;
  category?: string;
};

export const inventoryItemFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    sku: z.string(),
    category: z.string().trim().min(1, 'Category is required'),
    taxonomy: inventoryTaxonomySchema,
    unit: z.string().trim().min(1, 'Unit is required'),
    condition: inventoryConditionSchema,
    quantityAtJpNagar: z.string().trim().min(1, 'Quantity is required'),
    status: inventoryItemStatusSchema,
  })
  .superRefine((value, ctx) => {
    const qty = Number(value.quantityAtJpNagar);
    if (!Number.isInteger(qty) || qty < 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Quantity must be an integer ≥ 0',
        path: ['quantityAtJpNagar'],
      });
    }
  });

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;

export const createMovementFormSchema = z
  .object({
    bookingId: z.string().trim().uuid('Enter a valid booking UUID'),
    inventoryItemId: z.string().trim().uuid('Enter a valid inventory item UUID'),
    quantity: z.string().trim().min(1, 'Quantity is required'),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    const qty = Number(value.quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Quantity must be an integer ≥ 1',
        path: ['quantity'],
      });
    }
  });

export type CreateMovementFormValues = z.infer<typeof createMovementFormSchema>;

export const addDamageNoteFormSchema = z.object({
  message: z.string().trim().min(1, 'Message is required'),
  accountability: z.string(),
});

export type AddDamageNoteFormValues = z.infer<typeof addDamageNoteFormSchema>;

export function parseInventoryItem(body: unknown): InventoryItem {
  return inventoryItemEnvelopeSchema.parse(body).data;
}

export function parseInventoryItemList(body: unknown): InventoryItem[] {
  return inventoryItemListEnvelopeSchema.parse(body).data;
}

export function parseInventoryMovement(body: unknown): InventoryMovement {
  return inventoryMovementEnvelopeSchema.parse(body).data;
}

export function parseInventoryMovementList(body: unknown): InventoryMovement[] {
  return inventoryMovementListEnvelopeSchema.parse(body).data;
}

export function parseDamageNote(body: unknown): DamageNote {
  return damageNoteEnvelopeSchema.parse(body).data;
}

export function parseInventoryReservation(body: unknown): InventoryReservation {
  return inventoryReservationEnvelopeSchema.parse(body).data;
}

export function parseInventoryReservationList(
  body: unknown,
): InventoryReservation[] {
  return inventoryReservationListEnvelopeSchema.parse(body).data;
}

export function parseInventoryVerification(
  body: unknown,
): InventoryVerification {
  return inventoryVerificationEnvelopeSchema.parse(body).data;
}

export function parseInventoryVerificationList(
  body: unknown,
): InventoryVerification[] {
  return inventoryVerificationListEnvelopeSchema.parse(body).data;
}

export function parseInventoryDamageReport(
  body: unknown,
): InventoryDamageReport {
  return inventoryDamageReportEnvelopeSchema.parse(body).data;
}

export function parseInventoryDamageReportList(
  body: unknown,
): InventoryDamageReport[] {
  return inventoryDamageReportListEnvelopeSchema.parse(body).data;
}

export function findInventoryItemInList(
  items: InventoryItem[],
  id: string,
): InventoryItem {
  const found = items.find((item) => item.id === id);
  if (!found) {
    throw new ApiError(404, {
      code: 'NOT_FOUND',
      message: 'Inventory item not found in list (no GET-by-id in Phase 1 API).',
    });
  }
  return found;
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function toCreateInventoryItemRequest(
  values: InventoryItemFormValues,
): CreateInventoryItemRequest {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    taxonomy: values.taxonomy,
    unit: values.unit.trim(),
    condition: values.condition,
    quantityAtJpNagar: Number(values.quantityAtJpNagar),
    ...(optionalText(values.sku) ? { sku: optionalText(values.sku) } : { sku: null }),
  };
}

export function toUpdateInventoryItemRequest(
  values: InventoryItemFormValues,
): UpdateInventoryItemRequest {
  return {
    name: values.name.trim(),
    category: values.category.trim(),
    taxonomy: values.taxonomy,
    unit: values.unit.trim(),
    condition: values.condition,
    quantityAtJpNagar: Number(values.quantityAtJpNagar),
    status: values.status,
    sku: optionalText(values.sku) ?? null,
  };
}

export function inventoryItemToFormValues(
  item: InventoryItem,
): InventoryItemFormValues {
  return {
    name: item.name,
    sku: item.sku ?? '',
    category: item.category,
    taxonomy: item.taxonomy,
    unit: item.unit,
    condition: item.condition,
    quantityAtJpNagar: String(item.quantityAtJpNagar),
    status: item.status,
  };
}

export function toCreateMovementRequest(
  values: CreateMovementFormValues,
): CreateInventoryMovementRequest {
  const notes = optionalText(values.notes);
  return {
    bookingId: values.bookingId.trim(),
    inventoryItemId: values.inventoryItemId.trim(),
    quantity: Number(values.quantity),
    ...(notes ? { notes } : {}),
  };
}

export function toAddDamageNoteRequest(
  values: AddDamageNoteFormValues,
): AddDamageNoteRequest {
  const accountability = optionalText(values.accountability);
  return {
    message: values.message.trim(),
    ...(accountability ? { accountability } : {}),
  };
}

export function toTransitionRequest(
  toStatus: Exclude<MovementStatus, 'planned'>,
  notes?: string,
): TransitionInventoryMovementRequest {
  const trimmed = notes?.trim();
  return {
    toStatus,
    ...(trimmed ? { notes: trimmed } : {}),
  } as TransitionInventoryMovementRequest;
}

export function bucketMovementStatus(
  status: MovementStatus,
): 'reservations' | 'packing' | 'dispatch' | 'returns' | 'damage' | 'other' {
  if (
    status === 'planned' ||
    status === 'picked' ||
    status === 'packing_started'
  ) {
    return status === 'packing_started' ? 'packing' : 'reservations';
  }
  if (
    status === 'packed' ||
    status === 'verified' ||
    status === 'ready_for_dispatch'
  ) {
    return 'packing';
  }
  if (
    status === 'loaded' ||
    status === 'dispatched' ||
    status === 'at_venue'
  ) {
    return 'dispatch';
  }
  if (
    status === 'returned' ||
    status === 'return_verified' ||
    status === 'cleaned_ready'
  ) {
    return 'returns';
  }
  return 'other';
}
