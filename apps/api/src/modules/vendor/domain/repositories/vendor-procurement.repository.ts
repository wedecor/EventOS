import type {
  ProcurementDeliveryStatus,
  ProcurementLineStatus,
  VendorProcurementWorkflowStatus,
} from '@prisma/client';

export type VendorProcurementRecord = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  status: ProcurementLineStatus;
  workflowStatus: VendorProcurementWorkflowStatus;
  serviceCategory: string | null;
  requiredDate: Date | null;
  estimatedCost: number | null;
  approvedCost: number | null;
  actualCost: number | null;
  deliveryStatus: ProcurementDeliveryStatus;
  deliveryNotes: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateVendorProcurementData = {
  bookingId: string;
  vendorId: string;
  notes?: string | null;
  serviceCategory?: string | null;
  requiredDate?: Date | null;
  estimatedCost?: number | null;
};

export type UpdateVendorProcurementData = {
  status?: ProcurementLineStatus;
  workflowStatus?: VendorProcurementWorkflowStatus;
  serviceCategory?: string | null;
  requiredDate?: Date | null;
  estimatedCost?: number | null;
  approvedCost?: number | null;
  actualCost?: number | null;
  deliveryStatus?: ProcurementDeliveryStatus;
  deliveryNotes?: string | null;
  notes?: string | null;
};

export abstract class VendorProcurementRepository {
  abstract create(
    tenantId: string,
    data: CreateVendorProcurementData,
  ): Promise<VendorProcurementRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<VendorProcurementRecord | null>;

  abstract findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<VendorProcurementRecord[]>;

  abstract findAll(tenantId: string): Promise<VendorProcurementRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateVendorProcurementData,
    version: number,
  ): Promise<VendorProcurementRecord>;
}
