import type { VendorProcurementRecord } from '../../domain/repositories/vendor-procurement.repository';
import type { ProcurementQuoteRecord } from '../../domain/repositories/procurement-quote.repository';
import type { PurchaseOrderRecord } from '../../domain/repositories/purchase-order.repository';
import type { ProcurementTimelineEventRecord } from '../../domain/repositories/procurement-timeline-event.repository';
import { type ProcurementLineDto } from './procurement-line.dto';

export type ProcurementCostSummaryDto = {
  estimatedCost: number | null;
  approvedCost: number | null;
  actualCost: number | null;
  variance: number | null;
  currency: string;
};

export type ProcurementQuoteDto = ProcurementQuoteRecord;
export type PurchaseOrderDto = PurchaseOrderRecord;
export type ProcurementTimelineEventDto = ProcurementTimelineEventRecord;

export type VendorProcurementDto = {
  id: string;
  tenantId: string;
  bookingId: string;
  vendorId: string;
  status: VendorProcurementRecord['status'];
  workflowStatus: VendorProcurementRecord['workflowStatus'];
  serviceCategory: string | null;
  requiredDate: Date | null;
  estimatedCost: number | null;
  approvedCost: number | null;
  actualCost: number | null;
  deliveryStatus: VendorProcurementRecord['deliveryStatus'];
  deliveryNotes: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  lines: ProcurementLineDto[];
  quotes?: ProcurementQuoteDto[];
  purchaseOrders?: PurchaseOrderDto[];
  timeline?: ProcurementTimelineEventDto[];
  costSummary?: ProcurementCostSummaryDto;
  outstandingActions?: string[];
};

export function toProcurementQuoteDto(
  record: ProcurementQuoteRecord,
): ProcurementQuoteDto {
  return { ...record };
}

export function toPurchaseOrderDto(
  record: PurchaseOrderRecord,
): PurchaseOrderDto {
  return { ...record };
}

export function toProcurementTimelineEventDto(
  record: ProcurementTimelineEventRecord,
): ProcurementTimelineEventDto {
  return { ...record };
}

export function buildCostSummary(
  record: VendorProcurementRecord,
  lines: ProcurementLineDto[],
  currency = 'INR',
): ProcurementCostSummaryDto {
  const lineBudget = lines.reduce(
    (sum, line) => sum + (line.budgetedAmount ?? 0),
    0,
  );
  const lineActual = lines.reduce(
    (sum, line) => sum + (line.actualAmount ?? 0),
    0,
  );
  const estimatedCost =
    record.estimatedCost ?? (lineBudget > 0 ? lineBudget : null);
  const approvedCost = record.approvedCost;
  const actualCost = record.actualCost ?? (lineActual > 0 ? lineActual : null);
  const baseline = approvedCost ?? estimatedCost;
  const variance =
    actualCost !== null && baseline !== null ? actualCost - baseline : null;
  return { estimatedCost, approvedCost, actualCost, variance, currency };
}

export function buildOutstandingActions(
  record: VendorProcurementRecord,
  quotes: ProcurementQuoteRecord[],
  orders: PurchaseOrderRecord[],
): string[] {
  const actions: string[] = [];
  if (
    record.workflowStatus === 'cancelled' ||
    record.workflowStatus === 'completed'
  ) {
    return actions;
  }
  if (record.workflowStatus === 'draft') {
    actions.push('Request vendor quotation');
  }
  if (
    record.workflowStatus === 'quotation_requested' ||
    record.workflowStatus === 'quotation_received'
  ) {
    if (quotes.length === 0) actions.push('Record vendor quotation');
    if (!quotes.some((q) => q.status === 'approved')) {
      actions.push('Approve a quotation');
    }
  }
  if (record.workflowStatus === 'approved') {
    actions.push('Issue purchase order');
  }
  if (
    record.workflowStatus === 'purchase_ordered' &&
    orders.every((o) => o.status !== 'issued')
  ) {
    actions.push('Mark purchase order issued');
  }
  if (record.workflowStatus === 'vendor_confirmed') {
    actions.push('Record materials delivery');
  }
  if (record.workflowStatus === 'materials_delivered') {
    actions.push('Mark procurement completed');
  }
  if (
    record.deliveryStatus === 'pending' ||
    record.deliveryStatus === 'partial'
  ) {
    if (record.workflowStatus === 'vendor_confirmed') {
      actions.push('Update delivery status');
    }
  }
  return [...new Set(actions)];
}

export function toVendorProcurementDto(
  record: VendorProcurementRecord,
  lines: ProcurementLineDto[],
  extras?: {
    quotes?: ProcurementQuoteRecord[];
    purchaseOrders?: PurchaseOrderRecord[];
    timeline?: ProcurementTimelineEventRecord[];
  },
): VendorProcurementDto {
  const quotes = extras?.quotes ?? [];
  const purchaseOrders = extras?.purchaseOrders ?? [];
  const timeline = extras?.timeline ?? [];
  return {
    ...record,
    lines,
    quotes: quotes.map(toProcurementQuoteDto),
    purchaseOrders: purchaseOrders.map(toPurchaseOrderDto),
    timeline: timeline.map(toProcurementTimelineEventDto),
    costSummary: buildCostSummary(record, lines),
    outstandingActions: buildOutstandingActions(record, quotes, purchaseOrders),
  };
}
