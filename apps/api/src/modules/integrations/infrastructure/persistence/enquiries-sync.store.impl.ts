import { Injectable } from '@nestjs/common';
import type { ExternalRecordLink, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { EventFunctionRepositoryImpl } from '../../../booking/infrastructure/persistence/event-function.repository.impl';
import { EventRepositoryImpl } from '../../../booking/infrastructure/persistence/event.repository.impl';
import { CustomerRepositoryImpl } from '../../../customer/infrastructure/persistence/customer.repository.impl';
import {
  EnquiriesSyncStore,
  EnquiriesSyncTransaction,
  type ExternalRecordLinkRecord,
  type UpsertExternalRecordLinkData,
} from '../../domain/repositories/enquiries-sync.store';

/** Transaction-client shape handed to `$transaction(async (client) => …)`. */
type PrismaTransactionClient = Prisma.TransactionClient;

const TRANSACTION_OPTIONS = { maxWait: 5_000, timeout: 30_000 } as const;

function toLinkRecord(row: ExternalRecordLink): ExternalRecordLinkRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    source: row.source,
    externalId: row.externalId,
    entityType: row.entityType,
    entityId: row.entityId,
    lastSourceUpdatedAt: row.lastSourceUpdatedAt,
    lastPayload: (row.lastPayload ?? {}) as Record<string, unknown>,
    lastDeliveryId: row.lastDeliveryId,
    syncedAt: row.syncedAt,
  };
}

class PrismaEnquiriesSyncTransaction extends EnquiriesSyncTransaction {
  readonly customers: CustomerRepositoryImpl;
  readonly events: EventRepositoryImpl;
  readonly functions: EventFunctionRepositoryImpl;

  constructor(
    private readonly tenantId: string,
    private readonly client: PrismaTransactionClient,
  ) {
    super();
    // The regular repositories only use model delegates, which the transaction
    // client exposes identically — so their mapping/versioning rules are reused.
    const asService = client as unknown as PrismaService;
    this.customers = new CustomerRepositoryImpl(asService);
    this.events = new EventRepositoryImpl(asService);
    this.functions = new EventFunctionRepositoryImpl(asService);
  }

  async lockFeed(): Promise<void> {
    const key = `enquiries-feed:${this.tenantId}`;
    await this.client
      .$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }

  async findLink(
    source: string,
    externalId: string,
  ): Promise<ExternalRecordLinkRecord | null> {
    const row = await this.client.externalRecordLink.findUnique({
      where: {
        tenantId_source_externalId: {
          tenantId: this.tenantId,
          source,
          externalId,
        },
      },
    });
    return row ? toLinkRecord(row) : null;
  }

  async upsertLink(
    data: UpsertExternalRecordLinkData,
  ): Promise<ExternalRecordLinkRecord> {
    const payload = data.lastPayload as Prisma.InputJsonValue;
    const row = await this.client.externalRecordLink.upsert({
      where: {
        tenantId_source_externalId: {
          tenantId: this.tenantId,
          source: data.source,
          externalId: data.externalId,
        },
      },
      create: {
        tenantId: this.tenantId,
        source: data.source,
        externalId: data.externalId,
        entityType: data.entityType,
        entityId: data.entityId,
        lastSourceUpdatedAt: data.lastSourceUpdatedAt,
        lastPayload: payload,
        lastDeliveryId: data.lastDeliveryId,
        syncedAt: data.syncedAt,
      },
      update: {
        entityType: data.entityType,
        entityId: data.entityId,
        lastSourceUpdatedAt: data.lastSourceUpdatedAt,
        lastPayload: payload,
        lastDeliveryId: data.lastDeliveryId,
        syncedAt: data.syncedAt,
      },
    });
    return toLinkRecord(row);
  }
}

@Injectable()
export class PrismaEnquiriesSyncStore extends EnquiriesSyncStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  runInTransaction<T>(
    tenantId: string,
    work: (tx: EnquiriesSyncTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      (client) => work(new PrismaEnquiriesSyncTransaction(tenantId, client)),
      TRANSACTION_OPTIONS,
    );
  }

  async findLinksByExternalIds(
    tenantId: string,
    source: string,
    externalIds: readonly string[],
  ): Promise<Array<{ externalId: string; lastSourceUpdatedAt: Date }>> {
    if (externalIds.length === 0) {
      return [];
    }
    return this.prisma.externalRecordLink.findMany({
      where: { tenantId, source, externalId: { in: [...externalIds] } },
      select: { externalId: true, lastSourceUpdatedAt: true },
    });
  }

  async findLinkByEntity(
    tenantId: string,
    source: string,
    entityType: string,
    entityId: string,
  ): Promise<ExternalRecordLinkRecord | null> {
    const row = await this.prisma.externalRecordLink.findFirst({
      where: { tenantId, source, entityType, entityId },
    });
    return row ? toLinkRecord(row) : null;
  }
}
