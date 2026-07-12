import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  ProcurementLineIssueNoteAddedEvent,
  ProcurementLinePlannedEvent,
  ProcurementLineStatusChangedEvent,
} from '../../../../shared/events/sprint4-domain.events';
import { QuotationLineItemRepository } from '../../../quotation/domain/repositories/quotation-line-item.repository';
import { ProcurementLineIssueNoteRepository } from '../../domain/repositories/procurement-line-issue-note.repository';
import {
  ProcurementLineRepository,
  type ProcurementLineRecord,
  type UpdateProcurementLineData,
} from '../../domain/repositories/procurement-line.repository';
import { VendorProcurementRepository } from '../../domain/repositories/vendor-procurement.repository';
import {
  toProcurementLineIssueNoteDto,
  type ProcurementLineIssueNoteDto,
} from '../dtos/procurement-line-issue-note.dto';
import {
  toProcurementLineDto,
  type ProcurementLineDto,
} from '../dtos/procurement-line.dto';

export type AddProcurementLineInput = {
  description: string;
  category: string;
  quantity?: number;
  budgetedAmount?: number | null;
  currency?: string;
  quotationLineItemId?: string | null;
  notes?: string | null;
};

export type TransitionProcurementLineInput = {
  toStatus: ProcurementLineRecord['status'];
  occurredAt?: Date | null;
  notes?: string | null;
  actualAmount?: number;
  costVarianceReason?: ProcurementLineRecord['costVarianceReason'];
};

export type AddProcurementLineIssueNoteInput = {
  message: string;
  severity: ProcurementLineIssueNoteDto['severity'];
  occurredAt?: Date | null;
};

type LineStatus = ProcurementLineRecord['status'];

// EP1-VEN-003 — Confirmation Workflow (Phase 1 Requirement), `docs/business/07-vendor-management.md`
// §5B: "Planned → Requested → Confirmed → Delivered/Completed". Per the Category Mapping and
// Override Requirement in the same section, `confirmed` may advance directly to either `delivered`
// (material-only categories) or `completed` (service-only categories), and `delivered` may still
// advance to `completed` for categories needing both checkpoints (e.g. lighting/sound
// delivery + setup).
const ALLOWED_TRANSITIONS: Record<LineStatus, LineStatus[]> = {
  planned: ['requested'],
  requested: ['confirmed'],
  confirmed: ['delivered', 'completed'],
  delivered: ['completed'],
  completed: [],
};

function timestampUpdateFor(
  toStatus: LineStatus,
  occurredAt: Date,
): Pick<
  UpdateProcurementLineData,
  'requestedAt' | 'confirmedAt' | 'deliveredAt' | 'completedAt'
> {
  switch (toStatus) {
    case 'requested':
      return { requestedAt: occurredAt };
    case 'confirmed':
      return { confirmedAt: occurredAt };
    case 'delivered':
      return { deliveredAt: occurredAt };
    case 'completed':
      return { completedAt: occurredAt };
    default:
      return {};
  }
}

// EP1-VEN-002, EP1-VEN-003, EP1-VEN-005, EP1-VEN-006 — Procurement line lifecycle, cost variance
// recording, and line-level issue notes. State transitions are human-initiated direct commands
// (`EP1-AUT-005`, `07-vendor-management.md` VM-02), consistent with `InventoryMovementApplicationService`
// and `StaffAssignmentApplicationService` precedent.
@Injectable()
export class ProcurementLineApplicationService {
  constructor(
    private readonly procurementLineRepository: ProcurementLineRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly issueNoteRepository: ProcurementLineIssueNoteRepository,
    private readonly quotationLineItemRepository: QuotationLineItemRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  // EP1-VEN-002 — Add a planned procurement line under a procurement header
  async addLine(
    tenantId: string,
    vendorProcurementId: string,
    input: AddProcurementLineInput,
  ): Promise<Result<ProcurementLineDto>> {
    const procurement = await this.vendorProcurementRepository.findById(
      tenantId,
      vendorProcurementId,
    );
    if (!procurement) {
      return failure('NOT_FOUND', 'Vendor procurement not found.');
    }

    if (!input.description?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Procurement line description is required.',
      );
    }
    if (!input.category?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'Procurement line category is required.',
      );
    }
    if (input.quantity !== undefined && input.quantity <= 0) {
      return failure('VALIDATION_ERROR', 'Quantity must be greater than zero.');
    }

    if (input.quotationLineItemId) {
      const lineItem = await this.quotationLineItemRepository.findById(
        tenantId,
        input.quotationLineItemId,
      );
      if (!lineItem) {
        return failure('NOT_FOUND', 'Quotation line item not found.');
      }
    }

    const line = await this.procurementLineRepository.create(
      tenantId,
      vendorProcurementId,
      procurement.bookingId,
      {
        description: input.description,
        category: input.category,
        quantity: input.quantity,
        budgetedAmount: input.budgetedAmount,
        currency: input.currency,
        quotationLineItemId: input.quotationLineItemId,
        notes: input.notes,
      },
    );

    this.eventPublisher.publish(
      new ProcurementLinePlannedEvent(tenantId, line),
    );

    return success(toProcurementLineDto(line));
  }

  // EP1-VEN-003, EP1-VEN-005 — Human-initiated state transition with optional cost variance recording
  async transitionLine(
    tenantId: string,
    lineId: string,
    input: TransitionProcurementLineInput,
    version: number,
  ): Promise<Result<ProcurementLineDto>> {
    const existing = await this.procurementLineRepository.findById(
      tenantId,
      lineId,
    );
    if (!existing) {
      return failure('NOT_FOUND', 'Procurement line not found.');
    }

    const transitionError = this.checkTransition(
      existing.status,
      input.toStatus,
    );
    if (transitionError) {
      return transitionError;
    }

    const variance = this.resolveCostVariance(existing, input);
    if (!variance.ok) {
      return variance;
    }

    const occurredAt = input.occurredAt ?? new Date();

    try {
      const line = await this.procurementLineRepository.update(
        tenantId,
        lineId,
        {
          status: input.toStatus,
          notes: input.notes,
          actualAmount: input.actualAmount,
          costVarianceAmount: variance.value.costVarianceAmount,
          costVarianceReason: variance.value.costVarianceReason,
          ...timestampUpdateFor(input.toStatus, occurredAt),
        },
        version,
      );

      this.eventPublisher.publish(
        new ProcurementLineStatusChangedEvent(tenantId, line, existing.status),
      );

      return success(toProcurementLineDto(line));
    } catch (error: unknown) {
      return this.handleConcurrency(error, lineId);
    }
  }

  // EP1-VEN-006 — Procurement-line-level issue/feedback note (lightweight, no ticket workflow)
  async addIssueNote(
    tenantId: string,
    lineId: string,
    input: AddProcurementLineIssueNoteInput,
  ): Promise<Result<ProcurementLineIssueNoteDto>> {
    const line = await this.procurementLineRepository.findById(
      tenantId,
      lineId,
    );
    if (!line) {
      return failure('NOT_FOUND', 'Procurement line not found.');
    }

    if (!input.message?.trim()) {
      return failure('VALIDATION_ERROR', 'Issue note message is required.');
    }

    const note = await this.issueNoteRepository.create(tenantId, lineId, {
      message: input.message,
      severity: input.severity,
      occurredAt: input.occurredAt,
    });

    this.eventPublisher.publish(
      new ProcurementLineIssueNoteAddedEvent(tenantId, note),
    );

    return success(toProcurementLineIssueNoteDto(note));
  }

  // EP1-VEN-005 — Cost Variance Flag + Reason (Phase 1 Requirement), `07-vendor-management.md` §11:
  // a reason (from the fixed list) is required whenever actual amount exceeds the budgeted amount.
  private resolveCostVariance(
    existing: ProcurementLineRecord,
    input: TransitionProcurementLineInput,
  ): Result<{
    costVarianceAmount: number | null;
    costVarianceReason: ProcurementLineRecord['costVarianceReason'];
  }> {
    if (input.actualAmount === undefined) {
      return success({
        costVarianceAmount: existing.costVarianceAmount,
        costVarianceReason: existing.costVarianceReason,
      });
    }

    if (existing.budgetedAmount === null) {
      return success({
        costVarianceAmount: null,
        costVarianceReason: input.costVarianceReason ?? null,
      });
    }

    const costVarianceAmount = input.actualAmount - existing.budgetedAmount;

    if (costVarianceAmount > 0 && !input.costVarianceReason) {
      return failure(
        'VALIDATION_ERROR',
        'A cost variance reason is required when the actual amount exceeds the budgeted amount.',
        {
          budgetedAmount: existing.budgetedAmount,
          actualAmount: input.actualAmount,
        },
      );
    }

    return success({
      costVarianceAmount,
      costVarianceReason:
        costVarianceAmount > 0 ? (input.costVarianceReason ?? null) : null,
    });
  }

  private checkTransition(
    from: LineStatus,
    to: LineStatus,
  ): Result<ProcurementLineDto> | null {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed.includes(to)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition procurement line from '${from}' to '${to}'.`,
        { from, to },
      );
    }

    return null;
  }

  private handleConcurrency<T>(error: unknown, lineId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Procurement line was modified by another request. Reload and retry.',
        { lineId },
      );
    }

    throw error;
  }
}
