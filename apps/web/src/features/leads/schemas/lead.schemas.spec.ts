import { describe, expect, it } from 'vitest';
import {
  allowedStagesFrom,
  createLeadFormSchema,
  parseLeadList,
  toCreateLeadRequest,
} from './lead.schemas';

const sampleLead = {
  id: 'l1',
  tenantId: 't1',
  customerId: null,
  assignedToId: null,
  source: 'manual',
  sourceDetail: null,
  stage: 'new' as const,
  lostReason: null,
  eventType: 'Wedding',
  eventStartDate: null,
  eventEndDate: null,
  venue: null,
  estimatedBudgetAmount: 100000,
  estimatedBudgetCurrency: 'INR',
  guestCount: 200,
  notes: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  version: 1,
};

describe('lead schemas', () => {
  it('parses lead list envelope', () => {
    expect(parseLeadList({ data: [sampleLead] })).toHaveLength(1);
  });

  it('maps create form to OpenAPI body', () => {
    expect(
      toCreateLeadRequest({
        source: 'instagram',
        sourceDetail: 'ad',
        eventType: 'Wedding',
        eventStart: '2026-08-01',
        eventEnd: '2026-08-02',
        venue: 'Hall',
        estimatedBudgetAmount: '50000',
        guestCount: '100',
        notes: 'note',
      }),
    ).toEqual({
      source: 'instagram',
      sourceDetail: 'ad',
      eventType: 'Wedding',
      eventDate: { start: '2026-08-01', end: '2026-08-02' },
      venue: 'Hall',
      estimatedBudget: { amount: 50000, currency: 'INR' },
      guestCount: 100,
      notes: 'note',
    });
  });

  it('validates create form source enum', () => {
    expect(
      createLeadFormSchema.safeParse({
        source: 'manual',
      }).success,
    ).toBe(true);
  });

  it('exposes allowed stage transitions matching backend rules', () => {
    expect(allowedStagesFrom('new')).toEqual(['in_talks', 'lost', 'cancelled']);
    expect(allowedStagesFrom('completed')).toEqual([]);
  });
});
