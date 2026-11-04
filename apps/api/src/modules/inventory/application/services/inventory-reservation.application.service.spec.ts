import { InventoryReservationApplicationService } from './inventory-reservation.application.service';

describe('InventoryReservationApplicationService', () => {
  const tenantId = 'tenant-1';
  const bookingId = 'booking-1';
  const inventoryItemId = 'item-1';

  let service: InventoryReservationApplicationService;
  let reservationRepository: {
    create: jest.Mock;
    findById: jest.Mock;
    findByBookingId: jest.Mock;
    findActiveByItemId: jest.Mock;
    update: jest.Mock;
  };
  let inventoryItemRepository: { findById: jest.Mock };
  let eventRepository: { findById: jest.Mock };
  let vendorProcurementRepository: { findById: jest.Mock };
  let availabilityService: { getAvailability: jest.Mock };

  beforeEach(() => {
    reservationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByBookingId: jest.fn(),
      findActiveByItemId: jest.fn(),
      update: jest.fn(),
    };
    inventoryItemRepository = { findById: jest.fn() };
    eventRepository = { findById: jest.fn() };
    vendorProcurementRepository = { findById: jest.fn() };
    availabilityService = { getAvailability: jest.fn() };

    service = new InventoryReservationApplicationService(
      reservationRepository,
      inventoryItemRepository as never,
      eventRepository as never,
      vendorProcurementRepository as never,
      availabilityService as never,
    );
  });

  it('reserves when stock is available', async () => {
    eventRepository.findById.mockResolvedValue({
      id: bookingId,
      status: 'in_preparation',
    });
    inventoryItemRepository.findById.mockResolvedValue({
      id: inventoryItemId,
      status: 'active',
    });
    availabilityService.getAvailability.mockResolvedValue({
      availableQuantity: 5,
    });
    reservationRepository.create.mockResolvedValue({
      id: 'res-1',
      tenantId,
      bookingId,
      inventoryItemId,
      quantity: 2,
      status: 'reserved',
      notes: null,
      vendorProcurementId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.createReservation(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('reserved');
    }
  });

  it('rejects overbooking', async () => {
    eventRepository.findById.mockResolvedValue({
      id: bookingId,
      status: 'in_preparation',
    });
    inventoryItemRepository.findById.mockResolvedValue({
      id: inventoryItemId,
      status: 'active',
    });
    availabilityService.getAvailability.mockResolvedValue({
      availableQuantity: 1,
    });

    const result = await service.createReservation(tenantId, {
      bookingId,
      inventoryItemId,
      quantity: 3,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INSUFFICIENT_INVENTORY');
    }
  });

  it('releases an active reservation', async () => {
    reservationRepository.findById.mockResolvedValue({
      id: 'res-1',
      status: 'reserved',
      version: 1,
    });
    reservationRepository.update.mockResolvedValue({
      id: 'res-1',
      tenantId,
      bookingId,
      inventoryItemId,
      quantity: 2,
      status: 'released',
      notes: null,
      vendorProcurementId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 2,
    });

    const result = await service.releaseReservation(tenantId, 'res-1', 1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('released');
    }
  });
});
