import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  VendorCreatedEvent,
  VendorIssueNoteAddedEvent,
  VendorStatusChangedEvent,
  VendorUpdatedEvent,
} from '../../../../shared/events/sprint4-domain.events';
import { VendorIssueNoteRepository } from '../../domain/repositories/vendor-issue-note.repository';
import {
  VendorRepository,
  type FindVendorsFilter,
  type VendorRecord,
} from '../../domain/repositories/vendor.repository';
import {
  toVendorIssueNoteDto,
  type VendorIssueNoteDto,
} from '../dtos/vendor-issue-note.dto';
import { toVendorDto, type VendorDto } from '../dtos/vendor.dto';

export type CreateVendorInput = {
  name: string;
  category: string;
  status?: VendorRecord['status'];
  contactName?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  servicesProvided?: string | null;
  pricingNotes?: string | null;
  paymentTerms?: string | null;
  taxDetails?: string | null;
  notes?: string | null;
};

export type UpdateVendorInput = {
  name?: string;
  category?: string;
  status?: VendorRecord['status'];
  contactName?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  servicesProvided?: string | null;
  pricingNotes?: string | null;
  paymentTerms?: string | null;
  taxDetails?: string | null;
  notes?: string | null;
  // Reason for a status change, required when moving to `paused`/`blocked` (`07-vendor-management.md`
  // §11A "Status changes should be supported by: Notes (reason for status change)"). Recorded as a
  // VendorIssueNote per `07-domain-model.md` §Vendor business invariant.
  statusReason?: string;
};

export type AddVendorIssueNoteInput = {
  message: string;
  severity: VendorIssueNoteDto['severity'];
  occurredAt?: Date | null;
};

// EP1-VEN-001 — Statuses that must capture a reason (`07-domain-model.md` §Vendor: "Paused/blocked
// status should capture reason via VendorIssueNote").
const STATUSES_REQUIRING_REASON: ReadonlySet<VendorRecord['status']> = new Set([
  'paused',
  'blocked',
]);

// EP1-VEN-001, EP1-VEN-006 — Vendor master + lightweight vendor-level issue notes. Vendor status
// is a flat classification (`07-vendor-management.md` §11A "Vendor Status Model": Preferred / Active
// / Backup / Paused / Blocked) rather than a strict sequential state machine — any status may be set
// at any time, but Paused/Blocked require a reason which is persisted as a VendorIssueNote.
@Injectable()
export class VendorApplicationService {
  constructor(
    private readonly vendorRepository: VendorRepository,
    private readonly vendorIssueNoteRepository: VendorIssueNoteRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createVendor(
    tenantId: string,
    input: CreateVendorInput,
  ): Promise<Result<VendorDto>> {
    if (!input.name?.trim()) {
      return failure('VALIDATION_ERROR', 'Vendor name is required.');
    }
    if (!input.category?.trim()) {
      return failure('VALIDATION_ERROR', 'Vendor category is required.');
    }

    const vendor = await this.vendorRepository.create(tenantId, {
      name: input.name,
      category: input.category,
      status: input.status,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      location: input.location,
      servicesProvided: input.servicesProvided,
      pricingNotes: input.pricingNotes,
      paymentTerms: input.paymentTerms,
      taxDetails: input.taxDetails,
      notes: input.notes,
    });

    this.eventPublisher.publish(new VendorCreatedEvent(tenantId, vendor));

    return success(toVendorDto(vendor));
  }

  async getVendorById(
    tenantId: string,
    id: string,
  ): Promise<Result<VendorDto>> {
    const vendor = await this.vendorRepository.findById(tenantId, id);
    if (!vendor) {
      return failure('NOT_FOUND', 'Vendor not found.');
    }

    return success(toVendorDto(vendor));
  }

  async listVendors(
    tenantId: string,
    filter?: FindVendorsFilter,
  ): Promise<Result<VendorDto[]>> {
    const vendors = await this.vendorRepository.findMany(tenantId, filter);
    return success(vendors.map(toVendorDto));
  }

  async updateVendor(
    tenantId: string,
    id: string,
    input: UpdateVendorInput,
    version: number,
  ): Promise<Result<VendorDto>> {
    const existing = await this.vendorRepository.findById(tenantId, id);
    if (!existing) {
      return failure('NOT_FOUND', 'Vendor not found.');
    }

    if (input.name !== undefined && !input.name.trim()) {
      return failure('VALIDATION_ERROR', 'Vendor name cannot be blank.');
    }
    if (input.category !== undefined && !input.category.trim()) {
      return failure('VALIDATION_ERROR', 'Vendor category cannot be blank.');
    }

    const isStatusChange =
      input.status !== undefined && input.status !== existing.status;

    if (
      isStatusChange &&
      input.status &&
      STATUSES_REQUIRING_REASON.has(input.status) &&
      !input.statusReason?.trim()
    ) {
      return failure(
        'VALIDATION_ERROR',
        `A reason is required when changing vendor status to '${input.status}'.`,
        { status: input.status },
      );
    }

    try {
      const vendor = await this.vendorRepository.update(
        tenantId,
        id,
        {
          name: input.name,
          category: input.category,
          status: input.status,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          location: input.location,
          servicesProvided: input.servicesProvided,
          pricingNotes: input.pricingNotes,
          paymentTerms: input.paymentTerms,
          taxDetails: input.taxDetails,
          notes: input.notes,
        },
        version,
      );

      if (isStatusChange) {
        this.eventPublisher.publish(
          new VendorStatusChangedEvent(tenantId, vendor, existing.status),
        );

        if (input.statusReason?.trim()) {
          const note = await this.vendorIssueNoteRepository.create(
            tenantId,
            id,
            {
              message: input.statusReason,
              severity: vendor.status === 'blocked' ? 'high' : 'medium',
            },
          );
          this.eventPublisher.publish(
            new VendorIssueNoteAddedEvent(tenantId, note),
          );
        }
      } else {
        this.eventPublisher.publish(new VendorUpdatedEvent(tenantId, vendor));
      }

      return success(toVendorDto(vendor));
    } catch (error: unknown) {
      return this.handleConcurrency(error, id);
    }
  }

  // EP1-VEN-006 — Vendor-level feedback/issue note (lightweight, no ticket workflow)
  async addIssueNote(
    tenantId: string,
    vendorId: string,
    input: AddVendorIssueNoteInput,
  ): Promise<Result<VendorIssueNoteDto>> {
    const vendor = await this.vendorRepository.findById(tenantId, vendorId);
    if (!vendor) {
      return failure('NOT_FOUND', 'Vendor not found.');
    }

    if (!input.message?.trim()) {
      return failure('VALIDATION_ERROR', 'Issue note message is required.');
    }

    const note = await this.vendorIssueNoteRepository.create(
      tenantId,
      vendorId,
      {
        message: input.message,
        severity: input.severity,
        occurredAt: input.occurredAt,
      },
    );

    this.eventPublisher.publish(new VendorIssueNoteAddedEvent(tenantId, note));

    return success(toVendorIssueNoteDto(note));
  }

  private handleConcurrency<T>(error: unknown, vendorId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Vendor was modified by another request. Reload and retry.',
        { vendorId },
      );
    }

    throw error;
  }
}
