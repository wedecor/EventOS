import { Injectable, Logger } from '@nestjs/common';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  AuditLogService,
  SYSTEM_ACTOR_ID,
} from '../../../../shared/audit';
import { normalizePhoneE164 } from '../../../../shared/application/phone-normalization';
import { EventFunctionUsageQuery } from '../../../../shared/application/ports/event-function-usage.query';
import { success, type Result } from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  BookingSyncedCancelledEvent,
  BookingSyncedCreatedEvent,
  BookingSyncedUpdatedEvent,
} from '../../../../shared/events/integration-domain.events';
import type {
  EventRecord,
  UpdateEventData,
} from '../../../booking/domain/repositories/event.repository';
import type {
  CreateEventFunctionData,
  EventFunctionRecord,
} from '../../../booking/domain/repositories/event-function.repository';
import type { CustomerRecord } from '../../../customer/domain/repositories/customer.repository';
import { BookingApplicationService } from '../../../booking/application/services/booking.application.service';
import {
  EnquiriesSyncStore,
  type EnquiriesSyncTransaction,
  type ExternalRecordLinkRecord,
} from '../../domain/repositories/enquiries-sync.store';
import {
  ENQUIRIES_CANCEL_REASON,
  ENQUIRIES_NOTES_PREFIX,
  ENQUIRIES_SOURCE,
  type EnquiriesFunctionInput,
  type EnquiriesSyncPayload,
  type EnquiriesSyncResponse,
} from '../enquiries-sync.types';
import {
  EnquiriesDeliveryLog,
  type DeliveryOutcome,
} from '../ports/enquiries-delivery-log';
import { EnquiriesFeedConfig } from '../ports/enquiries-feed.config';

const SYNCABLE_STATUSES: ReadonlySet<string> = new Set([
  'approved',
  'completed',
]);

type FunctionSummary = {
  added: number;
  updated: number;
  removed: number;
  cancelled: number;
};

type ProcessOutcome =
  | { kind: 'stale' }
  | { kind: 'not_approved' }
  | { kind: 'created'; event: EventRecord }
  | {
      kind: 'updated';
      event: EventRecord;
      changedFields: string[];
    }
  | { kind: 'cancelled'; event: EventRecord; changed: boolean }
  | { kind: 'cancel_rejected'; event: EventRecord };

type FirstPhase =
  ProcessOutcome | { kind: 'cancel_pending'; event: EventRecord };

/**
 * M5-01 — processes one signed Enquiries delivery (docs/integrations/
 * enquiries-bridge-contract.md §Processing rules). Each delivery runs in one
 * database transaction, serialised per tenant, ordered by `sourceUpdatedAt` and
 * idempotent. The only step outside the transaction is the cancel, which goes
 * through the regular `BookingApplicationService.cancelBooking` so tasks and
 * assignments follow the existing rules; it is idempotent on retry.
 *
 * TEMPORARY with the Firebase/Enquiries bridge (ADR-019 phase 3).
 */
@Injectable()
export class EnquiriesSyncApplicationService {
  private readonly logger = new Logger(EnquiriesSyncApplicationService.name);

  constructor(
    private readonly store: EnquiriesSyncStore,
    private readonly deliveryLog: EnquiriesDeliveryLog,
    private readonly functionUsage: EventFunctionUsageQuery,
    private readonly bookingService: BookingApplicationService,
    private readonly eventPublisher: DomainEventPublisher,
    private readonly auditLog: AuditLogService,
    private readonly config: EnquiriesFeedConfig,
  ) {}

  async sync(
    deliveryId: string,
    payload: EnquiriesSyncPayload,
  ): Promise<Result<EnquiriesSyncResponse>> {
    // Replay protection: a duplicate delivery id is acknowledged, not processed.
    if (!(await this.deliveryLog.claim(deliveryId))) {
      return success({ ok: true, duplicate: true });
    }

    const tenantId = this.config.tenantId;

    try {
      const outcome = await this.process(tenantId, deliveryId, payload);
      await this.afterProcessed(tenantId, deliveryId, payload, outcome);
      return success(toResponse(outcome));
    } catch (error: unknown) {
      // Let the sender's retry through, and record the failure for the status view.
      await this.deliveryLog.release(deliveryId);
      const message = error instanceof Error ? error.message : 'Unknown error';
      await this.deliveryLog.record({
        at: new Date(),
        deliveryId,
        enquiryId: payload.enquiryId,
        outcome: 'failed',
        detail: message,
      });
      await this.auditLog.record({
        actorId: SYSTEM_ACTOR_ID,
        tenantId,
        action: AUDIT_ACTIONS.ENQUIRIES_SYNC_PROCESSED,
        entityType: AUDIT_ENTITY_TYPES.EXTERNAL_RECORD,
        entityId: payload.enquiryId,
        outcome: 'failure',
        metadata: { enquiryId: payload.enquiryId, deliveryId, error: message },
      });
      this.logger.error(
        `Enquiries delivery failed (enquiryId=${payload.enquiryId}, deliveryId=${deliveryId}): ${message}`,
      );
      throw error;
    }
  }

  private async process(
    tenantId: string,
    deliveryId: string,
    payload: EnquiriesSyncPayload,
  ): Promise<ProcessOutcome> {
    const sourceUpdatedAt = new Date(payload.sourceUpdatedAt);

    const first = await this.store.runInTransaction<FirstPhase>(
      tenantId,
      async (tx) => {
        await tx.lockFeed();
        const link = await tx.findLink(ENQUIRIES_SOURCE, payload.enquiryId);

        // 2. Ordering — an older (or repeated) update never overwrites a newer one.
        if (isStale(link, sourceUpdatedAt)) {
          return { kind: 'stale' };
        }
        // 3. Only approved bookings enter EventOS.
        if (!link && !SYNCABLE_STATUSES.has(payload.status)) {
          return { kind: 'not_approved' };
        }
        if (link && payload.status === 'cancelled') {
          const event = await tx.events.findById(tenantId, link.entityId);
          if (!event) {
            throw new Error(
              `Linked booking ${link.entityId} not found (enquiryId=${payload.enquiryId}).`,
            );
          }
          return { kind: 'cancel_pending', event };
        }
        return this.upsert(
          tx,
          tenantId,
          deliveryId,
          payload,
          sourceUpdatedAt,
          link,
        );
      },
    );

    if (first.kind !== 'cancel_pending') {
      return first;
    }
    return this.cancel(
      tenantId,
      deliveryId,
      payload,
      sourceUpdatedAt,
      first.event,
    );
  }

  // ---------------------------------------------------------------- cancel

  private async cancel(
    tenantId: string,
    deliveryId: string,
    payload: EnquiriesSyncPayload,
    sourceUpdatedAt: Date,
    event: EventRecord,
  ): Promise<ProcessOutcome> {
    let cancelRejected = false;
    let changed = false;

    if (event.status !== 'cancelled') {
      const result = await this.bookingService.cancelBooking(
        tenantId,
        event.id,
        { reason: ENQUIRIES_CANCEL_REASON, version: event.version },
      );
      if (result.ok) {
        changed = true;
      } else if (result.error.code === 'INVALID_STATE') {
        // e.g. already completed in EventOS: keep EventOS status, store the source status.
        cancelRejected = true;
        this.logger.warn(
          `Cancel from Enquiries not applied (enquiryId=${payload.enquiryId}): booking is ${event.status}.`,
        );
      } else {
        throw new Error(`Booking cancel failed (${result.error.code}).`);
      }
    }

    return this.store.runInTransaction<ProcessOutcome>(tenantId, async (tx) => {
      await tx.lockFeed();
      const link = await tx.findLink(ENQUIRIES_SOURCE, payload.enquiryId);
      if (isStale(link, sourceUpdatedAt)) {
        // A newer delivery landed while cancelling; it already owns the link.
        return { kind: 'stale' };
      }
      const current = await tx.events.findById(tenantId, event.id);
      if (!current) {
        throw new Error(`Booking ${event.id} disappeared during cancel.`);
      }
      await tx.upsertLink(
        buildLinkData(payload, deliveryId, sourceUpdatedAt, current.id, link),
      );
      return cancelRejected
        ? { kind: 'cancel_rejected', event: current }
        : { kind: 'cancelled', event: current, changed };
    });
  }

  // ---------------------------------------------------------------- upsert

  private async upsert(
    tx: EnquiriesSyncTransaction,
    tenantId: string,
    deliveryId: string,
    payload: EnquiriesSyncPayload,
    sourceUpdatedAt: Date,
    link: ExternalRecordLinkRecord | null,
  ): Promise<ProcessOutcome> {
    const desired = toEventFields(payload);

    if (!link) {
      const customer = await this.resolveCustomerForNewEvent(
        tx,
        tenantId,
        payload.customer,
      );
      const maxBookingNumber = await tx.events.findMaxBookingNumber(tenantId);
      const completed = payload.status === 'completed';
      const event = await tx.events.create(tenantId, {
        customerId: customer.id,
        quotationId: null,
        bookingNumber: maxBookingNumber + 1,
        status: completed ? 'completed' : 'approved',
        completedAt: completed ? new Date() : null,
        preparationStatus: 'pending',
        ...desired,
        source: ENQUIRIES_SOURCE,
        externalRef: payload.enquiryId,
      });
      await this.syncFunctions(tx, tenantId, event.id, payload.functions);
      await tx.upsertLink(
        buildLinkData(payload, deliveryId, sourceUpdatedAt, event.id, null),
      );
      return { kind: 'created', event };
    }

    const existing = await tx.events.findById(tenantId, link.entityId);
    if (!existing) {
      throw new Error(
        `Linked booking ${link.entityId} not found (enquiryId=${payload.enquiryId}).`,
      );
    }

    const changedFields: string[] = [];
    const patch: UpdateEventData = {};
    if (existing.eventType !== desired.eventType) {
      patch.eventType = desired.eventType;
      changedFields.push('eventType');
    }
    if (!sameDate(existing.eventStartDate, desired.eventStartDate)) {
      patch.eventStartDate = desired.eventStartDate;
      changedFields.push('eventStartDate');
    }
    if (!sameDate(existing.eventEndDate, desired.eventEndDate)) {
      patch.eventEndDate = desired.eventEndDate;
      changedFields.push('eventEndDate');
    }
    if (existing.venueName !== desired.venueName) {
      patch.venueName = desired.venueName;
      changedFields.push('venueName');
    }
    if (existing.guestCount !== desired.guestCount) {
      patch.guestCount = desired.guestCount;
      changedFields.push('guestCount');
    }
    if (existing.requirementsNotes !== desired.requirementsNotes) {
      patch.requirementsNotes = desired.requirementsNotes;
      changedFields.push('requirementsNotes');
    }

    // Status: the source may only move a booking forward to `completed`; every
    // other status keeps the EventOS status (ops may have progressed it).
    if (
      payload.status === 'completed' &&
      existing.status !== 'completed' &&
      existing.status !== 'cancelled'
    ) {
      patch.status = 'completed';
      patch.completedAt = new Date();
      changedFields.push('status');
    } else if (
      payload.status === 'approved' &&
      existing.status === 'cancelled'
    ) {
      this.logger.warn(
        `Enquiries re-approved a cancelled booking; EventOS status kept (enquiryId=${payload.enquiryId}).`,
      );
    } else if (!SYNCABLE_STATUSES.has(payload.status)) {
      this.logger.warn(
        `Enquiries status "${payload.status}" not mapped; EventOS status "${existing.status}" kept (enquiryId=${payload.enquiryId}).`,
      );
    }

    const event =
      Object.keys(patch).length > 0
        ? await tx.events.update(tenantId, existing.id, patch, existing.version)
        : existing;

    const customer = await tx.customers.findById(tenantId, existing.customerId);
    if (customer) {
      const customerChanges = await this.reconcileCustomer(
        tx,
        tenantId,
        customer,
        payload.customer,
      );
      changedFields.push(
        ...customerChanges.map((field) => `customer.${field}`),
      );
    }

    const summary = await this.syncFunctions(
      tx,
      tenantId,
      event.id,
      payload.functions,
    );
    if (summary.added) changedFields.push(`functions.added:${summary.added}`);
    if (summary.updated) {
      changedFields.push(`functions.updated:${summary.updated}`);
    }
    if (summary.removed) {
      changedFields.push(`functions.removed:${summary.removed}`);
    }
    if (summary.cancelled) {
      changedFields.push(`functions.cancelled:${summary.cancelled}`);
    }

    await tx.upsertLink(
      buildLinkData(payload, deliveryId, sourceUpdatedAt, event.id, link),
    );
    return { kind: 'updated', event, changedFields };
  }

  // -------------------------------------------------------------- customer

  /** 4. Match by E.164 phone, else exact email, else create (never by name). */
  private async resolveCustomerForNewEvent(
    tx: EnquiriesSyncTransaction,
    tenantId: string,
    incoming: EnquiriesSyncPayload['customer'],
  ): Promise<CustomerRecord> {
    const phone = clean(incoming.phone);
    const email = clean(incoming.email);
    const phoneNormalized = normalizePhoneE164(phone);

    let match = phoneNormalized
      ? await tx.customers.findByPhoneNormalized(tenantId, phoneNormalized)
      : null;
    if (!match && email) {
      match = await tx.customers.findByEmail(tenantId, email);
    }

    if (match) {
      await this.reconcileCustomer(tx, tenantId, match, incoming);
      return match;
    }

    return tx.customers.create(tenantId, {
      displayName: incoming.name.trim(),
      primaryPhone: phone,
      primaryEmail: email,
      phoneNormalized,
      externalManaged: true,
    });
  }

  /**
   * Feed-managed customers (created by the feed, never edited in EventOS) follow
   * the source. Anything else only has blank contact fields filled — a name or
   * email edited in EventOS is never overwritten.
   */
  private async reconcileCustomer(
    tx: EnquiriesSyncTransaction,
    tenantId: string,
    customer: CustomerRecord,
    incoming: EnquiriesSyncPayload['customer'],
  ): Promise<string[]> {
    const phone = clean(incoming.phone);
    const email = clean(incoming.email);
    const phoneNormalized = normalizePhoneE164(phone);

    const patch: {
      displayName?: string;
      primaryEmail?: string | null;
      primaryPhone?: string | null;
      phoneNormalized?: string | null;
    } = {};
    const changed: string[] = [];

    if (customer.externalManaged) {
      const name = incoming.name.trim();
      if (name && name !== customer.displayName) {
        patch.displayName = name;
        changed.push('displayName');
      }
      if (email && email !== customer.primaryEmail) {
        patch.primaryEmail = email;
        changed.push('primaryEmail');
      }
    } else if (email && !customer.primaryEmail) {
      patch.primaryEmail = email;
      changed.push('primaryEmail');
    }

    const mayChangePhone = customer.externalManaged || !customer.primaryPhone;
    if (
      phone &&
      mayChangePhone &&
      phoneNormalized &&
      phoneNormalized !== customer.phoneNormalized
    ) {
      const holder = await tx.customers.findByPhoneNormalized(
        tenantId,
        phoneNormalized,
      );
      if (!holder || holder.id === customer.id) {
        patch.primaryPhone = phone;
        patch.phoneNormalized = phoneNormalized;
        changed.push('primaryPhone');
      }
    }

    if (changed.length > 0) {
      await tx.customers.update(tenantId, customer.id, patch, customer.version);
    }
    return changed;
  }

  // ------------------------------------------------------------- functions

  /**
   * 6. Replace the full set of functions (matched by `externalFunctionId`).
   * Missing functions are deleted only when nothing references them; otherwise
   * they are marked `cancelled`.
   */
  private async syncFunctions(
    tx: EnquiriesSyncTransaction,
    tenantId: string,
    bookingId: string,
    incoming: readonly EnquiriesFunctionInput[],
  ): Promise<FunctionSummary> {
    const summary: FunctionSummary = {
      added: 0,
      updated: 0,
      removed: 0,
      cancelled: 0,
    };
    const existing = await tx.functions.listByBooking(tenantId, bookingId);
    const byExternalId = new Map(
      existing
        .filter((fn) => fn.externalFunctionId !== null)
        .map((fn) => [fn.externalFunctionId as string, fn]),
    );
    const seen = new Set<string>();

    for (const [index, fn] of incoming.entries()) {
      const data = toFunctionData(fn, index);
      const match = byExternalId.get(fn.functionId);
      if (!match) {
        await tx.functions.create(tenantId, bookingId, data);
        summary.added += 1;
        continue;
      }
      seen.add(match.id);
      if (functionDiffers(match, data)) {
        const { externalFunctionId: _ignored, ...changes } = data;
        await tx.functions.update(
          tenantId,
          match.id,
          { ...changes, status: 'active' },
          match.version,
        );
        summary.updated += 1;
      }
    }

    const missing = existing.filter(
      (fn) =>
        fn.externalFunctionId !== null &&
        fn.status === 'active' &&
        !seen.has(fn.id),
    );
    if (missing.length > 0) {
      const inUse = await this.functionUsage.findInUseFunctionIds(
        tenantId,
        missing.map((fn) => fn.id),
      );
      for (const fn of missing) {
        if (inUse.has(fn.id)) {
          await tx.functions.update(
            tenantId,
            fn.id,
            { status: 'cancelled' },
            fn.version,
          );
          summary.cancelled += 1;
        } else {
          await tx.functions.delete(tenantId, fn.id);
          summary.removed += 1;
        }
      }
    }

    return summary;
  }

  // ------------------------------------------------- audit / log / events

  private async afterProcessed(
    tenantId: string,
    deliveryId: string,
    payload: EnquiriesSyncPayload,
    outcome: ProcessOutcome,
  ): Promise<void> {
    const event = 'event' in outcome ? outcome.event : null;
    const changedFields =
      outcome.kind === 'updated'
        ? outcome.changedFields
        : outcome.kind === 'cancelled' && outcome.changed
          ? ['status']
          : [];

    await this.deliveryLog.record({
      at: new Date(),
      deliveryId,
      enquiryId: payload.enquiryId,
      outcome: toLogOutcome(outcome),
    });

    await this.auditLog.record({
      actorId: SYSTEM_ACTOR_ID,
      tenantId,
      action: AUDIT_ACTIONS.ENQUIRIES_SYNC_PROCESSED,
      entityType: event
        ? AUDIT_ENTITY_TYPES.EVENT
        : AUDIT_ENTITY_TYPES.EXTERNAL_RECORD,
      entityId: event?.id ?? payload.enquiryId,
      outcome: 'success',
      metadata: {
        enquiryId: payload.enquiryId,
        deliveryId,
        result: outcome.kind,
        sourceStatus: payload.status,
        changedFields,
      },
    });

    try {
      switch (outcome.kind) {
        case 'created':
          this.eventPublisher.publish(
            new BookingSyncedCreatedEvent(
              tenantId,
              outcome.event,
              ENQUIRIES_SOURCE,
              payload.enquiryId,
            ),
          );
          break;
        case 'updated':
          if (outcome.changedFields.length > 0) {
            this.eventPublisher.publish(
              new BookingSyncedUpdatedEvent(
                tenantId,
                outcome.event,
                ENQUIRIES_SOURCE,
                payload.enquiryId,
                outcome.changedFields,
              ),
            );
          }
          break;
        case 'cancelled':
          if (outcome.changed) {
            this.eventPublisher.publish(
              new BookingSyncedCancelledEvent(
                tenantId,
                outcome.event,
                ENQUIRIES_SOURCE,
                payload.enquiryId,
              ),
            );
          }
          break;
        default:
          break;
      }
    } catch (error: unknown) {
      // Listeners must never fail an already-committed delivery.
      this.logger.error(
        `booking.synced.* listener failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

// ------------------------------------------------------------------ helpers

function isStale(
  link: ExternalRecordLinkRecord | null,
  sourceUpdatedAt: Date,
): boolean {
  return (
    link !== null &&
    sourceUpdatedAt.getTime() <= link.lastSourceUpdatedAt.getTime()
  );
}

function toResponse(outcome: ProcessOutcome): EnquiriesSyncResponse {
  switch (outcome.kind) {
    case 'stale':
      return { ok: true, ignored: 'stale' };
    case 'not_approved':
      return { ok: true, ignored: 'not_approved_never_synced' };
    default:
      return { ok: true, eventId: outcome.event.id };
  }
}

function toLogOutcome(outcome: ProcessOutcome): DeliveryOutcome {
  switch (outcome.kind) {
    case 'stale':
      return 'stale';
    case 'not_approved':
    case 'cancel_rejected':
      return 'ignored';
    default:
      return 'processed';
  }
}

/** Stored payload: when `money` is omitted (sender lacks access) keep the last known value. */
function buildLinkData(
  payload: EnquiriesSyncPayload,
  deliveryId: string,
  sourceUpdatedAt: Date,
  entityId: string,
  previous: ExternalRecordLinkRecord | null,
) {
  const lastPayload: Record<string, unknown> = { ...payload };
  if (!payload.money && previous?.lastPayload.money) {
    lastPayload.money = previous.lastPayload.money;
  }
  return {
    source: ENQUIRIES_SOURCE,
    externalId: payload.enquiryId,
    entityType: 'event',
    entityId,
    lastSourceUpdatedAt: sourceUpdatedAt,
    lastPayload,
    lastDeliveryId: deliveryId,
    syncedAt: new Date(),
  };
}

/** `YYYY-MM-DD` (IST calendar date) → UTC-midnight Date, never shifted. */
export function parseCalendarDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function sameDate(a: Date | null, b: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** The "main" function is the earliest one (date, then time) that has a location. */
function mainFunctionLocation(
  functions: readonly EnquiriesFunctionInput[],
): string | null {
  const sorted = [...functions].sort((a, b) =>
    `${a.date} ${a.time ?? '99:99'}`.localeCompare(
      `${b.date} ${b.time ?? '99:99'}`,
    ),
  );
  return clean(sorted.find((fn) => clean(fn.location))?.location);
}

function toEventFields(payload: EnquiriesSyncPayload) {
  const notes = clean(payload.event.notes);
  return {
    eventType: payload.event.eventType,
    eventStartDate: parseCalendarDate(payload.event.startDate),
    eventEndDate: parseCalendarDate(payload.event.endDate),
    venueName: mainFunctionLocation(payload.functions),
    guestCount: payload.event.guestCount ?? null,
    requirementsNotes: notes ? `${ENQUIRIES_NOTES_PREFIX} ${notes}` : null,
  };
}

function toFunctionData(
  fn: EnquiriesFunctionInput,
  sortOrder: number,
): CreateEventFunctionData & { externalFunctionId: string } {
  return {
    externalFunctionId: fn.functionId,
    eventType: fn.eventType,
    eventTypeLabel: clean(fn.eventTypeLabel),
    date: parseCalendarDate(fn.date),
    time: clean(fn.time),
    venueName: clean(fn.location),
    venueArea: clean(fn.locationArea),
    venueAddress: clean(fn.locationAddress),
    placeId: clean(fn.locationPlaceId),
    lat: fn.lat ?? null,
    lng: fn.lng ?? null,
    notes: clean(fn.notes),
    sortOrder,
    status: 'active',
  };
}

function functionDiffers(
  existing: EventFunctionRecord,
  data: CreateEventFunctionData,
): boolean {
  return (
    existing.status !== 'active' ||
    existing.eventType !== data.eventType ||
    existing.eventTypeLabel !== (data.eventTypeLabel ?? null) ||
    existing.date.getTime() !== data.date.getTime() ||
    existing.time !== (data.time ?? null) ||
    existing.venueName !== (data.venueName ?? null) ||
    existing.venueArea !== (data.venueArea ?? null) ||
    existing.venueAddress !== (data.venueAddress ?? null) ||
    existing.placeId !== (data.placeId ?? null) ||
    existing.lat !== (data.lat ?? null) ||
    existing.lng !== (data.lng ?? null) ||
    existing.notes !== (data.notes ?? null) ||
    existing.sortOrder !== (data.sortOrder ?? 0)
  );
}
