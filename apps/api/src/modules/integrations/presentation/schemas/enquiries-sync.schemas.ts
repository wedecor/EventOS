import { z } from 'zod';

/**
 * M5-01 — v1 payload of the Enquiries → EventOS booking feed. Every object is
 * `.strict()` except `raw` (opaque debugging passthrough). Keep in sync with
 * `docs/integrations/enquiries-bridge-contract.md`.
 */

const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD calendar date.')
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Not a valid calendar date.');

const wallClockTime = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm (24 h).');

const optionalText = (max: number) => z.string().max(max).nullish();

const functionSchema = z
  .object({
    functionId: z.string().min(1).max(256),
    eventType: z.string().min(1).max(100),
    eventTypeLabel: optionalText(200),
    date: calendarDate,
    time: wallClockTime.nullish(),
    location: optionalText(500),
    locationArea: optionalText(500),
    locationAddress: optionalText(1000),
    locationPlaceId: optionalText(256),
    lat: z.number().min(-90).max(90).nullish(),
    lng: z.number().min(-180).max(180).nullish(),
    notes: optionalText(4000),
  })
  .strict();

const moneySchema = z
  .object({
    totalCost: z.number().finite().nonnegative(),
    advancePaid: z.number().finite().nonnegative(),
    currency: z.string().length(3),
  })
  .strict();

export const enquiriesSyncSchema = z
  .object({
    schemaVersion: z.literal(1),
    source: z.literal('wedecor-enquiries'),
    enquiryId: z.string().min(1).max(256),
    sourceUpdatedAt: z.string().datetime({ offset: true }),
    status: z.string().min(1).max(64),
    customer: z
      .object({
        name: z.string().trim().min(1).max(200),
        phone: optionalText(40),
        email: optionalText(254),
      })
      .strict(),
    event: z
      .object({
        eventType: z.string().min(1).max(100),
        eventTypeLabel: optionalText(200),
        startDate: calendarDate,
        endDate: calendarDate,
        guestCount: z.number().int().nonnegative().max(1_000_000).nullish(),
        notes: optionalText(8000),
        assigneeName: optionalText(200),
      })
      .strict()
      .refine((event) => event.endDate >= event.startDate, {
        path: ['endDate'],
        message: 'endDate must not be before startDate.',
      }),
    functions: z
      .array(functionSchema)
      .max(100)
      .refine(
        (functions) =>
          new Set(functions.map((fn) => fn.functionId)).size ===
          functions.length,
        'functionId values must be unique.',
      ),
    money: moneySchema.nullish(),
    raw: z.unknown().optional(),
  })
  .strict();

export type EnquiriesSyncBody = z.infer<typeof enquiriesSyncSchema>;

/**
 * Opaque delivery id (replay-protected). Accepts UUID v4 and hash-derived ids
 * from the Enquiries backfill; Zod 4 `z.string().uuid()` is too strict (RFC 9562
 * version/variant bits) for those hash-formatted values.
 */
export const deliveryIdSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(
    /^[A-Za-z0-9._:-]+$/,
    'Delivery id must be 8–128 chars of A–Z, a–z, 0–9, ".", "_", ":", or "-".',
  );

export const backfillCheckSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            enquiryId: z.string().min(1).max(256),
            sourceUpdatedAt: z.string().datetime({ offset: true }),
          })
          .strict(),
      )
      .max(1000),
  })
  .strict();

export type BackfillCheckBody = z.infer<typeof backfillCheckSchema>;
