import { buildQuotationPdf } from './build-quotation-pdf';

describe('buildQuotationPdf', () => {
  const baseInput = {
    businessName: 'We Decor Events',
    quotationNumber: 42,
    revisionNumber: 1,
    issueDate: new Date('2026-11-01T00:00:00.000Z'),
    validUntil: new Date('2026-11-15T00:00:00.000Z'),
    status: 'sent',
    customerName: 'Asha Rao',
    customerEmail: 'asha@example.test',
    customerPhone: '+919999000001',
    eventType: 'Wedding',
    eventStartDate: new Date('2026-12-01'),
    eventEndDate: new Date('2026-12-02'),
    venue: 'Palace Hall',
    notes: 'Thank you for considering We Decor.',
    terms: 'Advance 25% before booking confirmation.',
    subtotalAmount: 100000,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 100000,
    currency: 'INR',
    lineItems: [
      {
        description: 'Stage décor package',
        quantity: 1,
        unitPriceAmount: 100000,
      },
    ],
  };

  it('returns a PDF buffer with expected filename and header signature', async () => {
    const result = await buildQuotationPdf(baseInput);
    expect(result.filename).toBe('Quotation-Q-00042-r1.pdf');
    expect(result.buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
    expect(result.buffer.length).toBeGreaterThan(500);
  });

  it('handles missing optional customer/event fields', async () => {
    const result = await buildQuotationPdf({
      ...baseInput,
      customerEmail: null,
      customerPhone: null,
      eventType: null,
      eventStartDate: null,
      eventEndDate: null,
      venue: null,
      notes: null,
      terms: null,
      validUntil: null,
      lineItems: [],
    });
    expect(result.buffer.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('supports multi-page output for many line items', async () => {
    const lineItems = Array.from({ length: 60 }, (_, index) => ({
      description: `Line item ${index + 1} with a longer decorative description for wrapping`,
      quantity: index + 1,
      unitPriceAmount: 1000 + index,
    }));
    const result = await buildQuotationPdf({
      ...baseInput,
      lineItems,
      subtotalAmount: 999999,
      totalAmount: 999999,
    });
    const asString = result.buffer.toString('latin1');
    // Multiple page objects indicate multi-page document.
    expect((asString.match(/\/Type \/Page\b/g) ?? []).length).toBeGreaterThan(1);
  });
});
