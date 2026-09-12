import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { VendorProcurementCreatedEvent } from '../../../../shared/events/sprint4-domain.events';
import { EventRepository } from '../../../booking/domain/repositories/event.repository';
import { ProcurementLineRepository } from '../../domain/repositories/procurement-line.repository';
import { VendorRepository } from '../../domain/repositories/vendor.repository';
import { VendorProcurementRepository } from '../../domain/repositories/vendor-procurement.repository';
import { toProcurementLineDto } from '../dtos/procurement-line.dto';
import {
  toVendorProcurementDto,
  type VendorProcurementDto,
} from '../dtos/vendor-procurement.dto';

export type CreateVendorProcurementInput = {
  vendorId: string;
  notes?: string | null;
};

// EP1-VEN-002 — Per-event procurement header linked to a booking and a vendor. Creation validates
// booking + vendor existence, mirroring `InventoryMovementApplicationService.createMovement()`
// (Sprint 3 precedent for cross-module existence checks via repository interfaces).
@Injectable()
export class VendorProcurementApplicationService {
  constructor(
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly procurementLineRepository: ProcurementLineRepository,
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

    // EP1-VEN-001 — "Blocked — should not be used again due to repeated quality or reliability
    // problems" (`07-vendor-management.md` §11A Vendor Status Model).
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
      },
    );

    this.eventPublisher.publish(
      new VendorProcurementCreatedEvent(tenantId, procurement),
    );

    return success(toVendorProcurementDto(procurement, []));
  }

  // EP1-VEN-002 — Event Workspace integration: procurement headers + lines for a booking
  async listProcurementsForBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<VendorProcurementDto[]>> {
    const procurements = await this.vendorProcurementRepository.findByBookingId(
      tenantId,
      bookingId,
    );

    const dtos = await Promise.all(
      procurements.map(async (procurement) => {
        const lines =
          await this.procurementLineRepository.findByVendorProcurementId(
            tenantId,
            procurement.id,
          );
        return toVendorProcurementDto(
          procurement,
          lines.map(toProcurementLineDto),
        );
      }),
    );

    return success(dtos);
  }
}
