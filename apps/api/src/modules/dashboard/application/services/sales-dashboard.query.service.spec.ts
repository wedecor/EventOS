import type {
  LeadRecord,
  LeadRepository,
} from '../../../lead/domain/repositories/lead.repository';
import { SalesDashboardQueryService } from './sales-dashboard.query.service';

describe('SalesDashboardQueryService', () => {
  const tenantId = 'tenant-1';

  const baseLead: LeadRecord = {
    id: 'lead-1',
    tenantId,
    customerId: null,
    assignedToId: null,
    source: 'website',
    sourceDetail: null,
    stage: 'new',
    lostReason: null,
    eventType: 'wedding',
    eventStartDate: null,
    eventEndDate: null,
    venue: null,
    estimatedBudgetAmount: null,
    estimatedBudgetCurrency: 'INR',
    guestCount: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let leadRepository: jest.Mocked<LeadRepository>;
  let service: SalesDashboardQueryService;

  beforeEach(() => {
    leadRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findAll: jest.fn().mockResolvedValue([]),
      findByStage: jest.fn(),
      update: jest.fn(),
      changeStage: jest.fn(),
    };

    service = new SalesDashboardQueryService(leadRepository);
  });

  describe('getSalesSummary', () => {
    it('returns zeroed summary when there are no leads', async () => {
      const result = await service.getSalesSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalLeads: 0,
          newLeadsInPeriod: 0,
          periodDays: 30,
          convertedLeads: 0,
          conversionRate: 0,
          byStage: {},
          bySource: {},
        });
      }
    });

    it('computes counts, conversion rate, and breakdowns by stage/source', async () => {
      leadRepository.findAll.mockResolvedValue([
        { ...baseLead, id: 'lead-1', stage: 'approved', source: 'website' },
        { ...baseLead, id: 'lead-2', stage: 'new', source: 'website' },
        { ...baseLead, id: 'lead-3', stage: 'lost', source: 'instagram' },
      ]);

      const result = await service.getSalesSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalLeads).toBe(3);
        expect(result.value.convertedLeads).toBe(1);
        expect(result.value.conversionRate).toBeCloseTo(1 / 3);
        expect(result.value.byStage).toEqual({ approved: 1, new: 1, lost: 1 });
        expect(result.value.bySource).toEqual({ website: 2, instagram: 1 });
      }
    });

    it('respects a custom period for newLeadsInPeriod', async () => {
      const oldLead = {
        ...baseLead,
        id: 'lead-old',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      };
      const recentLead = {
        ...baseLead,
        id: 'lead-recent',
        createdAt: new Date(),
      };
      leadRepository.findAll.mockResolvedValue([oldLead, recentLead]);

      const result = await service.getSalesSummary(tenantId, 7);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.newLeadsInPeriod).toBe(1);
        expect(result.value.periodDays).toBe(7);
      }
    });
  });

  describe('getLeadPipelineSummary', () => {
    it('returns empty stages when there are no leads', async () => {
      const result = await service.getLeadPipelineSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          totalLeads: 0,
          activeLeads: 0,
          stages: [],
        });
      }
    });

    it('groups leads by stage and counts only open stages as active', async () => {
      leadRepository.findAll.mockResolvedValue([
        { ...baseLead, id: 'lead-1', stage: 'new' },
        { ...baseLead, id: 'lead-2', stage: 'in_talks' },
        { ...baseLead, id: 'lead-3', stage: 'completed' },
        { ...baseLead, id: 'lead-4', stage: 'lost' },
      ]);

      const result = await service.getLeadPipelineSummary(tenantId);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalLeads).toBe(4);
        expect(result.value.activeLeads).toBe(2);
        expect(result.value.stages).toEqual(
          expect.arrayContaining([
            { stage: 'new', count: 1 },
            { stage: 'in_talks', count: 1 },
            { stage: 'completed', count: 1 },
            { stage: 'lost', count: 1 },
          ]),
        );
      }
    });
  });
});
