import { buildQuotationPdfLines } from './quotation-pdf-lines';

describe('buildQuotationPdfLines', () => {
  it('includes GST breakdown and line items', () => {
    const lines = buildQuotationPdfLines({
      tenantName: 'We Decor Events',
      quotation: {
        id: 'q-1',
        tenantId: 't-1',
        customerId: 'c-1',
        leadId: null,
        quotationNumber: 1001,
        revisionNumber: 1,
        status: 'sent',
        eventType: 'wedding',
        eventStartDate: null,
        eventEndDate: null,
        venue: 'Bangalore',
        validUntil: new Date('2099-12-31'),
        terms: null,
        notes: null,
        subtotalAmount: 100000,
        discountAmount: 0,
        taxAmount: 18000,
        totalAmount: 118000,
        currency: 'INR',
        supersededById: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      },
      lineItems: [
        {
          id: 'li-1',
          tenantId: 't-1',
          quotationId: 'q-1',
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
      ],
    });

    const text = lines.join('\n');
    expect(text).toContain('Tax (GST)');
    expect(text).toContain('Decor');
    expect(text).toContain('WE DECOR EVENTS');
    expect(text).toContain('Thank you for choosing We Decor Events.');
  });
});
