/**
 * M5-01 — Enquiries → EventOS booking feed, v1 contract types.
 * Mirrors `docs/integrations/enquiries-bridge-contract.md`; the runtime zod
 * schema lives in `presentation/schemas/enquiries-sync.schemas.ts`.
 * TEMPORARY with the bridge (ADR-019 phase 3).
 */

export const ENQUIRIES_SOURCE = 'wedecor-enquiries';
export const ENQUIRIES_CANCEL_REASON = 'Cancelled in Enquiries app';
export const ENQUIRIES_NOTES_PREFIX = '[From Enquiries]';
export const ENQUIRIES_TIMEZONE = 'Asia/Kolkata';

export type EnquiriesFunctionInput = {
  functionId: string;
  eventType: string;
  eventTypeLabel?: string | null;
  /** IST calendar date `YYYY-MM-DD`. */
  date: string;
  /** `HH:mm` IST wall-clock time. */
  time?: string | null;
  location?: string | null;
  locationArea?: string | null;
  locationAddress?: string | null;
  locationPlaceId?: string | null;
  lat?: number | null;
  lng?: number | null;
  notes?: string | null;
};

export type EnquiriesMoneyInput = {
  totalCost: number;
  advancePaid: number;
  currency: string;
};

export type EnquiriesSyncPayload = {
  schemaVersion: 1;
  source: typeof ENQUIRIES_SOURCE;
  enquiryId: string;
  /** ISO-8601 instant of the last change in the source system (ordering key). */
  sourceUpdatedAt: string;
  status: string;
  customer: {
    name: string;
    phone?: string | null;
    email?: string | null;
  };
  event: {
    eventType: string;
    eventTypeLabel?: string | null;
    startDate: string;
    endDate: string;
    guestCount?: number | null;
    notes?: string | null;
    assigneeName?: string | null;
  };
  functions: EnquiriesFunctionInput[];
  money?: EnquiriesMoneyInput | null;
  raw?: unknown;
};

export type EnquiriesSyncResponse =
  | { ok: true; eventId: string }
  | { ok: true; ignored: 'stale' | 'not_approved_never_synced' }
  | { ok: true; duplicate: true };
