import { Injectable } from '@nestjs/common';
import type {
  ProcurementDeliveryStatus,
  ProcurementLineStatus,
  VendorProcurementWorkflowStatus,
} from '@prisma/client';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { VendorProcurementCreatedEvent } from '../../../../shared/events/sprint4-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ProcurementLineRepository } from '../../domain/repositories/procurement-line.repository';
import { ProcurementQuoteRepository } from '../../domain/repositories/procurement-quote.repository';
import { ProcurementTimelineEventRepository } from '../../domain/repositories/procurement-timeline-event.repository';
import { PurchaseOrderRepository } from '../../domain/repositories/purchase-order.repository';
import { VendorRepository } from '../../domain/repositories/vendor.repository';
import {
  VendorProcurementRepository,
  type VendorProcurementRecord,
} from '../../domain/repositories/vendor-procurement.repository';
import { toProcurementLineDto } from '../dtos/procurement-line.dto';
import {
  toProcurementQuoteDto,
  toPurchaseOrderDto,
  toVendorProcurementDto,
  type ProcurementQuoteDto,
  type PurchaseOrderDto,
  type VendorProcurementDto,
} from '../dtos/vendor-procurement.dto';

export type CreateVendorProcurementInput = {
  vendorId: string;
  notes?: string | null;
  serviceCategory?: string | null;
  requiredDate?: string | null;
  estimatedCost?: number | null;
};

export type TransitionProcurementWorkflowInput = {
  toStatus: VendorProcurementWorkflowStatus;
  notes?: string | null;
};

export type UpdateDeliveryInput = {
  deliveryStatus: ProcurementDeliveryStatus;
  deliveryNotes?: string | null;
  actualCost?: number | null;
};

export type CreateQuoteInput = {
  amount: number;
  currency?: string;
  validUntil?: string | null;
  notes?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSizeBytes?: number | null;
};

export type CreatePurchaseOrderInput = {
  poNumber?: string;
  issueDate?: string;
  totalAmount?: number;
  currency?: string;
  notes?: string | null;
  issue?: boolean;
};

type WorkflowStatus = VendorProcurementWorkflowStatus;

const WORKFLOW_TRANSITIONS: Record<WorkflowStatus, WorkflowStatus[]> = {
  draft: ['quotation_requested', 'cancelled'],
  quotation_requested: ['quotation_received', 'cancelled'],
  quotation_received: ['approved', 'cancelled'],
  approved: ['purchase_ordered', 'cancelled'],
  purchase_ordered: ['vendor_confirmed', 'cancelled'],
  vendor_confirmed: ['materials_delivered', 'cancelled'],
  materials_delivered: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

function legacyStatusFor(workflow: WorkflowStatus): ProcurementLineStatus {
  switch (workflow) {
    case 'draft':
      return 'planned';
    case 'quotation_requested':
    case 'quotation_received':
    case 'approved':
      return 'requested';
    case 'purchase_ordered':
    case 'vendor_confirmed':
      return 'confirmed';
    case 'materials_delivered':
      return 'delivered';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'planned';
  }
}

function timelineTypeFor(workflow: WorkflowStatus) {
  switch (workflow) {
    case 'quotation_requested':
      return 'quote_requested' as const;
    case 'quotation_received':
      return 'quote_received' as const;
    case 'approved':
      return 'approved' as const;
    case 'purchase_ordered':
      return 'po_issued' as const;
    case 'vendor_confirmed':
      return 'vendor_confirmed' as const;
    case 'materials_delivered':
      return 'delivered' as const;
    case 'completed':
      return 'completed' as const;
    case 'cancelled':
      return 'cancelled' as const;
    default:
      return 'note_added' as const;
  }
}

// EP1-VEN-002 + P2-06 — Procurement header lifecycle, quotes, POs, delivery, cost, timeline.
@Injectable()
export class VendorProcurementApplicationService {
  constructor(
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly procurementLineRepository: ProcurementLineRepository,
    private readonly quoteRepository: ProcurementQuoteRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly timelineRepository: ProcurementTimelineEventRepository,
    private readonly vendorRepository: VendorRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createProcurement(
    tenantId: string,
    bookingId: string,
    input: CreateVendorProcurementInput,
  ): Promise<Result<VendorProcurementDto>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    if (booking.status === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot create a vendor procurement for a cancelled booking.',
        { bookingId, status: booking.status },
      );
    }

    const vendor = await this.vendorRepository.findById(
      tenantId,
      input.vendorId,
    );
    if (!vendor) {
      return failure('NOT_FOUND', 'Vendor not found.');
    }

    if (vendor.status === 'blocked') {
      return failure(
        'INVALID_STATE',
        'Cannot create a procurement for a blocked vendor.',
        { vendorId: input.vendorId },
      );
    }

    const procurement = await this.vendorProcurementRepository.create(
      tenantId,
      {
        bookingId,
        vendorId: input.vendorId,
        notes: input.notes,
        serviceCategory: input.serviceCategory,
        requiredDate: input.requiredDate ? new Date(input.requiredDate) : null,
        estimatedCost: input.estimatedCost,
      },
    );

    await this.timelineRepository.create(tenantId, {
      vendorProcurementId: procurement.id,
      bookingId,
      eventType: 'request_created',
      message: 'Procurement request created',
    });

    await this.vendorRepository.incrementPerformance(tenantId, vendor.id, {
      procurementCount: 1,
    });

    this.eventPublisher.publish(
      new VendorProcurementCreatedEvent(tenantId, procurement),
    );

    return success(await this.hydrate(tenantId, procurement));
  }

  async listProcurementsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<VendorProcurementDto[]>> {
    const procurements = await this.vendorProcurementRepository.findByBookingId(
      tenantId,
      bookingId,
    );
    const dtos = await Promise.all(
      procurements.map((p) => this.hydrate(tenantId, p)),
    );
    return success(dtos);
  }

  async listAll(tenantId: string): Promise<Result<VendorProcurementDto[]>> {
    const procurements =
      await this.vendorProcurementRepository.findAll(tenantId);
    const dtos = await Promise.all(
      procurements.map((p) => this.hydrate(tenantId, p)),
    );
    return success(dtos);
  }

  async getById(
    tenantId: string,
    id: string,
  ): Promise<Result<VendorProcurementDto>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      id,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }
    return success(await this.hydrate(tenantId, procurement));
  }

  async transitionWorkflow(
    tenantId: string,
    id: string,
    input: TransitionProcurementWorkflowInput,
    version: number,
  ): Promise<Result<VendorProcurementDto>> {
    const existing = await this.vendorProcurementRepository.findById(
      tenantId,
      id,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }

    const allowed = WORKFLOW_TRANSITIONS[existing.workflowStatus] ?? [];
    if (!allowed.includes(input.toStatus)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition procurement from '${existing.workflowStatus}' to '${input.toStatus}'.`,
        { from: existing.workflowStatus, to: input.toStatus },
      );
    }

    try {
      const updated = await this.vendorProcurementRepository.update(
        tenantId,
        id,
        {
          workflowStatus: input.toStatus,
          status: legacyStatusFor(input.toStatus),
          notes: input.notes !== undefined ? input.notes : existing.notes,
          ...(input.toStatus === 'materials_delivered'
            ? { deliveryStatus: 'delivered' as const }
            : {}),
          ...(input.toStatus === 'cancelled'
            ? { deliveryStatus: 'cancelled' as const }
            : {}),
        },
        version,
      );

      await this.timelineRepository.create(tenantId, {
        vendorProcurementId: id,
        bookingId: existing.bookingId,
        eventType: timelineTypeFor(input.toStatus),
        message: `Procurement ${input.toStatus.replace(/_/g, ' ')}`,
      });

      if (input.toStatus === 'completed') {
        await this.vendorRepository.incrementPerformance(
          tenantId,
          existing.vendorId,
          { completedProcurementCount: 1 },
        );
        if (existing.requiredDate && existing.deliveryStatus === 'delivered') {
          // Timeliness counted when completed after delivery recorded
          await this.vendorRepository.incrementPerformance(
            tenantId,
            existing.vendorId,
            { onTimeDeliveryCount: 1 },
          );
        }
      }

      return success(await this.hydrate(tenantId, updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Procurement was modified by another request. Reload and retry.',
          { id },
        );
      }
      throw error;
    }
  }

  async updateDelivery(
    tenantId: string,
    id: string,
    input: UpdateDeliveryInput,
    version: number,
  ): Promise<Result<VendorProcurementDto>> {
    const existing = await this.vendorProcurementRepository.findById(
      tenantId,
      id,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }

    try {
      const updated = await this.vendorProcurementRepository.update(
        tenantId,
        id,
        {
          deliveryStatus: input.deliveryStatus,
          deliveryNotes: input.deliveryNotes,
          actualCost:
            input.actualCost !== undefined
              ? input.actualCost
              : existing.actualCost,
          ...(input.deliveryStatus === 'delivered' &&
          existing.workflowStatus === 'vendor_confirmed'
            ? {
                workflowStatus: 'materials_delivered' as const,
                status: 'delivered' as const,
              }
            : {}),
        },
        version,
      );

      if (input.deliveryStatus === 'delivered') {
        await this.timelineRepository.create(tenantId, {
          vendorProcurementId: id,
          bookingId: existing.bookingId,
          eventType: 'delivered',
          message: 'Materials delivered',
        });
      }

      return success(await this.hydrate(tenantId, updated));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Procurement was modified by another request. Reload and retry.',
          { id },
        );
      }
      throw error;
    }
  }

  async createQuote(
    tenantId: string,
    vendorProcurementId: string,
    input: CreateQuoteInput,
  ): Promise<Result<ProcurementQuoteDto>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }
    if (procurement.workflowStatus === 'cancelled') {
      return failure(
        'INVALID_STATE',
        'Cannot add quotes to a cancelled procurement.',
      );
    }
    if (input.amount < 0) {
      return failure('VALIDATION_ERROR', 'Quote amount must be non-negative.');
    }

    const quote = await this.quoteRepository.create(tenantId, {
      vendorProcurementId,
      vendorId: procurement.vendorId,
      amount: input.amount,
      currency: input.currency,
      validUntil: input.validUntil ? new Date(input.validUntil) : null,
      notes: input.notes,
      attachmentName: input.attachmentName,
      attachmentMimeType: input.attachmentMimeType,
      attachmentSizeBytes: input.attachmentSizeBytes,
    });

    await this.timelineRepository.create(tenantId, {
      vendorProcurementId,
      bookingId: procurement.bookingId,
      eventType: 'quote_received',
      message: `Quote received: ${quote.amount} ${quote.currency}`,
    });

    if (
      procurement.workflowStatus === 'draft' ||
      procurement.workflowStatus === 'quotation_requested'
    ) {
      await this.vendorProcurementRepository.update(
        tenantId,
        vendorProcurementId,
        {
          workflowStatus: 'quotation_received',
          status: 'requested',
        },
        procurement.version,
      );
    }

    return success(toProcurementQuoteDto(quote));
  }

  async approveQuote(
    tenantId: string,
    quoteId: string,
    version: number,
  ): Promise<Result<ProcurementQuoteDto>> {
    const quote = await this.quoteRepository.findById(tenantId, quoteId);
    if (!quote) {
      return failure('NOT_FOUND', 'Procurement quote not found.');
    }

    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      quote.vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }

    const siblings = await this.quoteRepository.findByVendorProcurementId(
      tenantId,
      quote.vendorProcurementId,
    );
    for (const sibling of siblings) {
      if (sibling.id !== quoteId && sibling.status === 'approved') {
        await this.quoteRepository.update(
          tenantId,
          sibling.id,
          { status: 'rejected' },
          sibling.version,
        );
      }
    }

    try {
      const approved = await this.quoteRepository.update(
        tenantId,
        quoteId,
        { status: 'approved' },
        version,
      );

      await this.vendorProcurementRepository.update(
        tenantId,
        procurement.id,
        {
          workflowStatus: 'approved',
          status: 'requested',
          approvedCost: approved.amount,
        },
        procurement.version,
      );

      await this.timelineRepository.create(tenantId, {
        vendorProcurementId: procurement.id,
        bookingId: procurement.bookingId,
        eventType: 'approved',
        message: `Quote approved: ${approved.amount} ${approved.currency}`,
      });

      return success(toProcurementQuoteDto(approved));
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Quote was modified by another request. Reload and retry.',
          { id: quoteId },
        );
      }
      throw error;
    }
  }

  async createPurchaseOrder(
    tenantId: string,
    vendorProcurementId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<Result<PurchaseOrderDto>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }
    if (
      procurement.workflowStatus !== 'approved' &&
      procurement.workflowStatus !== 'purchase_ordered'
    ) {
      return failure(
        'INVALID_STATE',
        'Purchase orders require an approved procurement.',
        { workflowStatus: procurement.workflowStatus },
      );
    }

    const seq = await this.purchaseOrderRepository.nextPoSequence(tenantId);
    const poNumber =
      input.poNumber?.trim() ||
      `PO-${new Date().getUTCFullYear()}-${String(seq).padStart(4, '0')}`;
    const totalAmount =
      input.totalAmount ??
      procurement.approvedCost ??
      procurement.estimatedCost ??
      0;

    const order = await this.purchaseOrderRepository.create(tenantId, {
      vendorProcurementId,
      vendorId: procurement.vendorId,
      poNumber,
      issueDate: input.issueDate ? new Date(input.issueDate) : new Date(),
      totalAmount,
      currency: input.currency,
      notes: input.notes,
      status: input.issue ? 'issued' : 'draft',
    });

    await this.vendorProcurementRepository.update(
      tenantId,
      vendorProcurementId,
      {
        workflowStatus: 'purchase_ordered',
        status: 'confirmed',
      },
      procurement.version,
    );

    await this.timelineRepository.create(tenantId, {
      vendorProcurementId,
      bookingId: procurement.bookingId,
      eventType: 'po_issued',
      message: `Purchase order ${order.poNumber} ${input.issue ? 'issued' : 'created'}`,
    });

    return success(toPurchaseOrderDto(order));
  }

  async listQuotes(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<Result<ProcurementQuoteDto[]>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }
    const quotes = await this.quoteRepository.findByVendorProcurementId(
      tenantId,
      vendorProcurementId,
    );
    return success(quotes.map(toProcurementQuoteDto));
  }

  async listPurchaseOrders(
    tenantId: string,
    vendorProcurementId: string,
  ): Promise<Result<PurchaseOrderDto[]>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }
    const orders = await this.purchaseOrderRepository.findByVendorProcurementId(
      tenantId,
      vendorProcurementId,
    );
    return success(orders.map(toPurchaseOrderDto));
  }

  private async hydrate(
    tenantId: string,
    procurement: VendorProcurementRecord,
  ): Promise<VendorProcurementDto> {
    const [lines, quotes, purchaseOrders, timeline] = await Promise.all([
      this.procurementLineRepository.findByVendorProcurementId(
        tenantId,
        procurement.id,
      ),
      this.quoteRepository.findByVendorProcurementId(tenantId, procurement.id),
      this.purchaseOrderRepository.findByVendorProcurementId(
        tenantId,
        procurement.id,
      ),
      this.timelineRepository.findByVendorProcurementId(
        tenantId,
        procurement.id,
      ),
    ]);

    return toVendorProcurementDto(
      procurement,
      lines.map(toProcurementLineDto),
      { quotes, purchaseOrders, timeline },
    );
  }
}
