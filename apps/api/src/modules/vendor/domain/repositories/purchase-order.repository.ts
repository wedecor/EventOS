import type { PurchaseOrderStatus } from '@prisma/client';

export type PurchaseOrderRecord = {
  id: string;
  tenantId: string;
  vendorProcurementId: string;
  vendorId: string;
  poNumber: string;
  issueDate: Date;
  totalAmount: number;
  currency: string;
  notes: string | null;
  status: PurchaseOrderStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreatePurchaseOrderData = {
  vendorProcurementId: string;
  vendorId: string;
  poNumber: string;
  issueDate: Date;
  totalAmount: number;
  currency?: string;
  notes?: string | null;
  status?: PurchaseOrderStatus;
};

export type UpdatePurchaseOrderData = {
  status?: PurchaseOrderStatus;
  notes?: string | null;
  totalAmount?: number;
};

export abstract class PurchaseOrderRepository {
  abstract create(
    tenantId: string,
    data: CreatePurchaseOrderData,
  ): Promise<PurchaseOrderRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<PurchaseOrderRecord | null>;

  abstract findByVendorProcurementId(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<PurchaseOrderRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdatePurchaseOrderData,
    version: number,
  ): Promise<PurchaseOrderRecord>;

  abstract nextPoSequence(tenantId: string): Promise<number>;
}
