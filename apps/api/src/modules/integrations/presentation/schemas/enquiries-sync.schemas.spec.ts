import {
  backfillCheckSchema,
  deliveryIdSchema,
  enquiriesSyncSchema,
} from './enquiries-sync.schemas';

const valid = () => ({
  schemaVersion: 1,
  source: 'wedecor-enquiries',
  enquiryId: 'firestore-doc-id',
  sourceUpdatedAt: '2026-11-23T10:15:00.000Z',
  status: 'approved',
  customer: { name: 'Asha Rao', phone: '+919876543210', email: null },
  event: {
    eventType: 'wedding',
    eventTypeLabel: 'Wedding',
    startDate: '2026-12-10',
    endDate: '2026-12-12',
    guestCount: 300,
    notes: null,
    assigneeName: null,
  },
  functions: [
    {
      functionId: 'f1',
      eventType: 'haldi',
      eventTypeLabel: 'Haldi',
      date: '2026-12-10',
      time: '18:30',
      location: 'Grand Palace',
      locationArea: null,
      locationAddress: null,
      locationPlaceId: null,
      lat: 12.97,
      lng: 77.59,
      notes: null,
    },
  ],
  money: { totalCost: 250000, advancePaid: 50000, currency: 'INR' },
});

describe('enquiriesSyncSchema (M5-01 contract v1)', () => {
  it('accepts the documented payload, with or without money / raw', () => {
    expect(enquiriesSyncSchema.safeParse(valid()).success).toBe(true);

    const { money: _money, ...withoutMoney } = valid();
    expect(enquiriesSyncSchema.safeParse(withoutMoney).success).toBe(true);
    expect(
      enquiriesSyncSchema.safeParse({ ...valid(), raw: { anything: [1, 2] } })
        .success,
    ).toBe(true);
  });

  it('accepts sparse optional fields as null or omitted', () => {
    const body = valid();
    body.functions = [
      { functionId: 'f1', eventType: 'haldi', date: '2026-12-10' } as never,
    ];
    body.customer = { name: 'Only Name' } as never;

    expect(enquiriesSyncSchema.safeParse(body).success).toBe(true);
  });

  it.each([
    [
      'unknown top-level key (tenantId)',
      (b: Record<string, unknown>) => ({ ...b, tenantId: 'x' }),
    ],
    [
      'wrong schemaVersion',
      (b: Record<string, unknown>) => ({ ...b, schemaVersion: 2 }),
    ],
    [
      'wrong source',
      (b: Record<string, unknown>) => ({ ...b, source: 'other' }),
    ],
    [
      'empty enquiryId',
      (b: Record<string, unknown>) => ({ ...b, enquiryId: '' }),
    ],
    [
      'non-ISO sourceUpdatedAt',
      (b: Record<string, unknown>) => ({ ...b, sourceUpdatedAt: 'yesterday' }),
    ],
    [
      'unknown customer key',
      (b: Record<string, unknown>) => ({
        ...b,
        customer: { name: 'A', extra: 1 },
      }),
    ],
  ])('rejects %s', (_label, mutate) => {
    expect(
      enquiriesSyncSchema.safeParse(mutate(valid() as Record<string, unknown>))
        .success,
    ).toBe(false);
  });

  it('rejects invalid calendar dates and end before start', () => {
    const impossible = valid();
    impossible.event.startDate = '2026-02-30';
    expect(enquiriesSyncSchema.safeParse(impossible).success).toBe(false);

    const reversed = valid();
    reversed.event.endDate = '2026-12-09';
    expect(enquiriesSyncSchema.safeParse(reversed).success).toBe(false);
  });

  it('rejects bad times, coordinates and duplicate function ids', () => {
    const badTime = valid();
    badTime.functions[0].time = '25:00';
    expect(enquiriesSyncSchema.safeParse(badTime).success).toBe(false);

    const badLat = valid();
    badLat.functions[0].lat = 91;
    expect(enquiriesSyncSchema.safeParse(badLat).success).toBe(false);

    const duplicate = valid();
    duplicate.functions.push({ ...duplicate.functions[0] });
    expect(enquiriesSyncSchema.safeParse(duplicate).success).toBe(false);
  });

  it('rejects unknown keys inside functions and money, and negative money', () => {
    const extraFn = valid();
    (extraFn.functions[0] as Record<string, unknown>).secret = 1;
    expect(enquiriesSyncSchema.safeParse(extraFn).success).toBe(false);

    const negative = valid();
    negative.money.totalCost = -1;
    expect(enquiriesSyncSchema.safeParse(negative).success).toBe(false);

    const extraMoney = { ...valid(), money: { ...valid().money, tax: 1 } };
    expect(enquiriesSyncSchema.safeParse(extraMoney).success).toBe(false);
  });
});

describe('deliveryIdSchema / backfillCheckSchema', () => {
  it('requires a UUID delivery id', () => {
    expect(
      deliveryIdSchema.safeParse('5b8f6b44-3c58-4e3d-8c1a-0a6e4f1a2b3c')
        .success,
    ).toBe(true);
    expect(deliveryIdSchema.safeParse('not-a-uuid').success).toBe(false);
    expect(deliveryIdSchema.safeParse(undefined).success).toBe(false);
  });

  it('validates backfill items and caps the list at 1000', () => {
    const item = { enquiryId: 'e1', sourceUpdatedAt: '2026-11-23T10:00:00Z' };
    expect(backfillCheckSchema.safeParse({ items: [item] }).success).toBe(true);
    expect(
      backfillCheckSchema.safeParse({ items: Array(1001).fill(item) }).success,
    ).toBe(false);
    expect(backfillCheckSchema.safeParse({ items: [], x: 1 }).success).toBe(
      false,
    );
  });
});
