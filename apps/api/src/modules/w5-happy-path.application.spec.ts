import { AdvancePaymentQuery } from '../shared/application/ports/advance-payment.query';
import { LeadConversionQuery } from '../shared/application/ports/lead-conversion.query';
import { DomainEventPublisher } from '../shared/events/domain-event.base';
import { BookingApplicationService } from './booking/application/services/booking.application.service';
import { CustomerApplicationService } from './customer/application/services/customer.application.service';
import { LeadApplicationService } from './lead/application/services/lead.application.service';
import { PaymentApplicationService } from './payment/application/services/payment.application.service';
import { QuotationApplicationService } from './quotation/application/services/quotation.application.service';

describe('W5 happy path (application)', () => {
  const tenantId = 'tenant-1';

  it('runs client → quotation → payment → send → approve → booking → lead approved', async () => {
    const publish = jest.fn();
    const eventPublisher = { publish } as unknown as DomainEventPublisher;
    const advancePaymentQuery = {
      hasConfirmedAdvance: jest.fn().mockResolvedValue(true),
    } as unknown as AdvancePaymentQuery;
    const leadConversionQuery = {
      validateForApproval: jest.fn().mockResolvedValue({
        ok: true,
        value: {
          customerId: 'customer-1',
          quotationId: 'quotation-1',
          eventId: 'event-1',
        },
      }),
    } as unknown as LeadConversionQuery;

    const leadRecord = {
      id: 'lead-1',
      tenantId,
      customerId: 'customer-1',
      assignedToId: null,
      source: 'website' as const,
      sourceDetail: null,
      stage: 'in_talks' as const,
      lostReason: null,
      eventType: 'wedding',
      eventStartDate: new Date('2099-01-01'),
      eventEndDate: new Date('2099-01-02'),
      venue: 'Bangalore',
      estimatedBudgetAmount: 100000,
      estimatedBudgetCurrency: 'INR',
      guestCount: 200,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };

    const quotationBase = {
      id: 'quotation-1',
      tenantId,
      customerId: 'customer-1',
      leadId: 'lead-1',
      quotationNumber: 1001,
      revisionNumber: 1,
      eventType: 'wedding',
      eventStartDate: new Date('2099-01-01'),
      eventEndDate: new Date('2099-01-02'),
      venue: 'Bangalore',
      validUntil: new Date('2099-12-31'),
      terms: null,
      notes: null,
      subtotalAmount: 100000,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 100000,
      currency: 'INR',
      supersededById: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const leadRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(leadRecord),
      findByPhone: jest.fn(),
      findByStage: jest.fn(),
      listAll: jest.fn(),
      update: jest.fn(),
      changeStage: jest.fn().mockResolvedValue({
        ...leadRecord,
        stage: 'approved',
        version: 2,
      }),
    };

    const customerRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'customer-1',
        tenantId,
        displayName: 'Priya',
        type: 'individual' as const,
        status: 'active' as const,
        primaryPhone: '+919999999999',
        primaryEmail: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }),
      findById: jest.fn(),
      findByPhone: jest.fn().mockResolvedValue([]),
      findByDisplayName: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      listAll: jest.fn(),
    };

    let quotationStatus: 'draft' | 'sent' | 'approved' = 'draft';
    let quotationVersion = 1;

    const quotationRepository = {
      create: jest.fn().mockImplementation(() => ({
        ...quotationBase,
        status: quotationStatus,
        version: quotationVersion,
      })),
      findById: jest.fn().mockImplementation(() => ({
        ...quotationBase,
        status: quotationStatus,
        version: quotationVersion,
      })),
      findLatestRevision: jest.fn(),
      findMaxQuotationNumber: jest.fn().mockResolvedValue(1000),
      update: jest
        .fn()
        .mockImplementation(
          (
            _t: string,
            _id: string,
            data: { status?: typeof quotationStatus },
          ) => {
            if (data.status) {
              quotationStatus = data.status;
            }
            quotationVersion += 1;
            return {
              ...quotationBase,
              status: quotationStatus,
              version: quotationVersion,
            };
          },
        ),
    };

    const lineItemRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listActiveByQuotation: jest.fn().mockResolvedValue([
        {
          id: 'line-1',
          tenantId,
          quotationId: 'quotation-1',
          description: 'Decor',
          packageId: null,
          quantity: 1,
          unitPrice: 100000,
          sortOrder: 0,
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      ]),
      update: jest.fn(),
      softDelete: jest.fn(),
      countActiveByQuotation: jest.fn().mockResolvedValue(1),
    };

    const eventRepository = {
      create: jest.fn().mockResolvedValue({
        id: 'event-1',
        tenantId,
        customerId: 'customer-1',
        leadId: 'lead-1',
        quotationId: 'quotation-1',
        bookingNumber: 5001,
        status: 'approved' as const,
        eventType: 'wedding',
        eventStartDate: new Date('2099-01-01'),
        eventEndDate: new Date('2099-01-02'),
        venueName: 'Bangalore',
        guestCount: null,
        requirementsNotes: null,
        preparationStatus: 'pending' as const,
        operationalMilestone: null,
        executionOwnerId: null,
        cancellationReason: null,
        completedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      }),
      findById: jest.fn(),
      findByQuotationId: jest.fn().mockResolvedValue(null),
      findMaxBookingNumber: jest.fn().mockResolvedValue(5000),
      findByEventDate: jest.fn(),
      update: jest.fn(),
    };

    const paymentRepository = {
      create: jest.fn().mockResolvedValue({ id: 'payment-1' }),
      hasConfirmedAdvance: jest.fn().mockResolvedValue(true),
    };

    const followUpRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      listByLeadId: jest.fn(),
      update: jest.fn(),
    };

    const contactRepository = {
      create: jest.fn(),
      countByCustomer: jest.fn(),
    };

    const customerService = new CustomerApplicationService(
      customerRepository,
      contactRepository,
      eventPublisher,
    );
    const quotationService = new QuotationApplicationService(
      quotationRepository,
      lineItemRepository,
      {
        findById: jest.fn().mockResolvedValue({
          id: tenantId,
          name: 'We Decor',
          slug: 'we-decor',
        }),
      },
      eventPublisher,
    );
    const paymentService = new PaymentApplicationService(
      paymentRepository,
      eventRepository,
      leadRepository,
      quotationRepository,
      eventPublisher,
    );
    const bookingService = new BookingApplicationService(
      eventRepository,
      quotationRepository,
      advancePaymentQuery,
      eventPublisher,
    );
    const leadService = new LeadApplicationService(
      leadRepository,
      followUpRepository,
      customerRepository,
      advancePaymentQuery,
      leadConversionQuery,
      eventPublisher,
    );

    expect(
      (
        await customerService.createCustomer(tenantId, {
          displayName: 'Priya',
          primaryPhone: '+919999999999',
        })
      ).ok,
    ).toBe(true);

    expect(
      (
        await quotationService.createQuotation(tenantId, {
          customerId: 'customer-1',
          leadId: 'lead-1',
        })
      ).ok,
    ).toBe(true);

    expect(
      (
        await paymentService.recordPayment(tenantId, {
          leadId: 'lead-1',
          amount: 50000,
          method: 'upi',
          receivedAt: new Date(),
          paymentType: 'advance',
        })
      ).ok,
    ).toBe(true);

    expect(
      (await quotationService.sendQuotation(tenantId, 'quotation-1', 1)).ok,
    ).toBe(true);

    expect(
      (await quotationService.approveQuotation(tenantId, 'quotation-1', 2)).ok,
    ).toBe(true);

    expect(
      (
        await bookingService.createEventFromApprovedQuotation(
          tenantId,
          'quotation-1',
        )
      ).ok,
    ).toBe(true);

    expect(
      (
        await leadService.changeLeadStage(tenantId, 'lead-1', {
          stage: 'approved',
          version: 1,
        })
      ).ok,
    ).toBe(true);
  });
});
