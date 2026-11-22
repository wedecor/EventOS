import type { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import type { EventRepository } from '../../../booking/domain/repositories/event.repository';
import type { EventFunctionRepository } from '../../../booking/domain/repositories/event-function.repository';

/** `ExternalRecordLink` row (M5-01). */
export type ExternalRecordLinkRecord = {
  id: string;
  tenantId: string;
  source: string;
  externalId: string;
  entityType: string;
  entityId: string;
  lastSourceUpdatedAt: Date;
  lastPayload: Record<string, unknown>;
  lastDeliveryId: string;
  syncedAt: Date;
};

export type UpsertExternalRecordLinkData = {
  source: string;
  externalId: string;
  entityType: string;
  entityId: string;
  lastSourceUpdatedAt: Date;
  lastPayload: Record<string, unknown>;
  lastDeliveryId: string;
  syncedAt: Date;
};

/**
 * Everything one feed delivery may touch, bound to a single database
 * transaction. The repositories are the regular booking/customer ones, pointed
 * at the transaction client, so their rules (versioning, mapping) are reused.
 */
export abstract class EnquiriesSyncTransaction {
  abstract readonly customers: Pick<
    CustomerRepository,
    'create' | 'update' | 'findById' | 'findByPhoneNormalized' | 'findByEmail'
  >;
  abstract readonly events: Pick<
    EventRepository,
    'create' | 'update' | 'findById' | 'findMaxBookingNumber'
  >;
  abstract readonly functions: Pick<
    EventFunctionRepository,
    'listByBooking' | 'create' | 'update' | 'delete'
  >;

  /**
   * Serialise feed deliveries for the tenant (transaction-scoped advisory lock).
   * Protects `bookingNumber` allocation and per-enquiry read-modify-write.
   */
  abstract lockFeed(): Promise<void>;

  abstract findLink(
    source: string,
    externalId: string,
  ): Promise<ExternalRecordLinkRecord | null>;

  abstract upsertLink(
    data: UpsertExternalRecordLinkData,
  ): Promise<ExternalRecordLinkRecord>;
}

export abstract class EnquiriesSyncStore {
  abstract runInTransaction<T>(
    tenantId: string,
    work: (tx: EnquiriesSyncTransaction) => Promise<T>,
  ): Promise<T>;

  abstract findLinksByExternalIds(
    tenantId: string,
    source: string,
    externalIds: readonly string[],
  ): Promise<Array<{ externalId: string; lastSourceUpdatedAt: Date }>>;

  abstract findLinkByEntity(
    tenantId: string,
    source: string,
    entityType: string,
    entityId: string,
  ): Promise<ExternalRecordLinkRecord | null>;
}
