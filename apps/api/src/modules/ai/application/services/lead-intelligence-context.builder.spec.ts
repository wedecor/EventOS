import { LEAD_INTELLIGENCE_COMMUNICATION_LIMIT } from '../lead-intelligence.constants';
import { LeadIntelligenceContextBuilder } from './lead-intelligence-context.builder';

describe('LeadIntelligenceContextBuilder', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const leadId = 'lead-1';

  let leadRepository: { findById: jest.Mock };
  let customerRepository: { findById: jest.Mock };
  let communicationRecordRepository: { findByLeadId: jest.Mock };
  let builder: LeadIntelligenceContextBuilder;

  beforeEach(() => {
    leadRepository = { findById: jest.fn() };
    customerRepository = { findById: jest.fn() };
    communicationRecordRepository = { findByLeadId: jest.fn() };
    builder = new LeadIntelligenceContextBuilder(
      leadRepository as never,
      customerRepository as never,
      communicationRecordRepository as never,
    );
  });

  it('returns NOT_FOUND when lead is unavailable in tenant scope', async () => {
    leadRepository.findById.mockResolvedValue(null);
    const result = await builder.build(tenantId, leadId);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
    expect(leadRepository.findById).toHaveBeenCalledWith(tenantId, leadId);
  });

  it('builds minimized customer + bounded communications without phone/email plaintext', async () => {
    leadRepository.findById.mockResolvedValue({
      id: leadId,
      customerId: 'cust-1',
      stage: 'new',
      source: 'whatsapp',
      sourceDetail: null,
      eventType: 'reception',
      eventStartDate: new Date('2026-11-20'),
      eventEndDate: null,
      venue: 'JP Nagar',
      estimatedBudgetAmount: 150000,
      estimatedBudgetCurrency: 'INR',
      guestCount: null,
      notes: 'Need floral arch',
    });
    customerRepository.findById.mockResolvedValue({
      id: 'cust-1',
      displayName: 'Priya',
      type: 'individual',
      status: 'active',
      primaryPhone: '+919999999999',
      primaryEmail: 'priya@example.com',
    });
    communicationRecordRepository.findByLeadId.mockResolvedValue(
      Array.from({ length: 25 }, (_, i) => ({
        id: `c-${i}`,
        channel: 'whatsapp',
        direction: 'incoming',
        status: 'delivered',
        occurredAt: new Date(2026, 0, i + 1),
        subject: null,
        body: `msg ${i}`,
      })),
    );

    const result = await builder.build(tenantId, leadId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.customer).toEqual({
      id: 'cust-1',
      displayName: 'Priya',
      type: 'individual',
      status: 'active',
      hasPhone: true,
      hasEmail: true,
    });
    expect(JSON.stringify(result.value)).not.toContain('+919999999999');
    expect(JSON.stringify(result.value)).not.toContain('priya@example.com');
    expect(result.value.communications).toHaveLength(
      LEAD_INTELLIGENCE_COMMUNICATION_LIMIT,
    );
    expect(result.value.meta.communicationLimit).toBe(
      LEAD_INTELLIGENCE_COMMUNICATION_LIMIT,
    );
    expect(result.value.communications[0].bodyPreview).toContain(
      '<untrusted_customer_content>',
    );
  });

  it('supports empty communication history', async () => {
    leadRepository.findById.mockResolvedValue({
      id: leadId,
      customerId: null,
      stage: 'new',
      source: 'manual',
      sourceDetail: null,
      eventType: null,
      eventStartDate: null,
      eventEndDate: null,
      venue: null,
      estimatedBudgetAmount: null,
      estimatedBudgetCurrency: 'INR',
      guestCount: null,
      notes: null,
    });
    communicationRecordRepository.findByLeadId.mockResolvedValue([]);

    const result = await builder.build(tenantId, leadId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.customer).toBeNull();
    expect(result.value.communications).toEqual([]);
    expect(result.value.lead.eventType).toBeNull();
  });
});
