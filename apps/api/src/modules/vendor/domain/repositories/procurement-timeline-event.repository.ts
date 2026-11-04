import type { ProcurementTimelineEventType } from '@prisma/client';

export type ProcurementTimelineEventRecord = {
  id: string;
  tenantId: string;
  vendorProcurementId: string;
  bookingId: string;
  eventType: ProcurementTimelineEventType;
  message: string;
  occurredAt: Date;
  createdAt: Date;
};

export type CreateProcurementTimelineEventData = {
  vendorProcurementId: string;
  bookingId: string;
  eventType: ProcurementTimelineEventType;
  message: string;
  occurredAt?: Date;
};

export abstract class ProcurementTimelineEventRepository {
  abstract create(
    tenantId: string,
    data: CreateProcurementTimelineEventData,
  ): Promise<ProcurementTimelineEventRecord>;

  abstract findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<ProcurementTimelineEventRecord[]>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<ProcurementTimelineEventRecord[]>;
}
