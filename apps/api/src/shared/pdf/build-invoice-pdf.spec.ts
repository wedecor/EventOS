import { buildInvoicePdf } from './build-invoice-pdf';

describe('buildInvoicePdf', () => {
  it('embeds paid and outstanding amounts from provided totals', async () => {
    const result = await buildInvoicePdf({
      businessName: 'We Decor Events',
      invoiceNumber: 7,
      invoiceDate: new Date('2026-11-10T00:00:00.000Z'),
      status: 'sent',
      customerName: 'Asha Rao',
      customerEmail: null,
      customerPhone: null,
      bookingNumber: 3,
      eventType: 'Wedding',
      venueName: 'Palace Hall',
      notes: null,
      subtotalAmount: 100000,
      taxAmount: 0,
      totalAmount: 100000,
      currency: 'INR',
      paidAmount: 25000,
      outstandingAmount: 75000,
      lineItems: [
        {
          description: 'Stage décor package',
          quantity: 1,
          unitPriceAmount: 100000,
        },
      ],
    });

    expect(result.filename).toBe('Invoice-INV-00007.pdf');
    expect(result.buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(result.buffer.length).toBeGreaterThan(500);
  });
});
