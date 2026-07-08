import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  FollowUpCreatedEvent,
  LeadAssignedEvent,
  LeadCreatedEvent,
  LeadStageChangedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import { AdvancePaymentQuery } from '../../../../shared/application/ports/advance-payment.query';
import { LeadApplicationService } from './lead.application.service';
import type { FollowUpRepository } from '../../domain/repositories/follow-up.repository';
import type {
  LeadRepository,
  LeadRecord,
} from '../../domain/repositories/lead.repository';

describe('LeadApplicationService', () => {
  const tenantId = 'tenant-1';
  const leadId = 'lead-1';

  const baseLead: LeadRecord = {
    id: leadId,
    tenantId,
    customerId: null,
    assignedToId: null,
    source: 'website',
    sourceDetail: null,
    stage: 'new',
    lostReason: null,
    eventType: 'wedding',
    eventStartDate: new Date('2026-08-01'),
    eventEndDate: new Date('2026-08-02'),
    venue: 'Bangalore',
    estimatedBudgetAmount: 100000,
    estimatedBudgetCurrency: 'INR',
    guestCount: 200,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let leadRepository: jest.Mocked<LeadRepository>;
  let followUpRepository: jest.Mocked<FollowUpRepository>;
  let advancePaymentQuery: jest.Mocked<AdvancePaymentQuery>;
  let eventPublisher: jest.Mocked<DomainEventPublisher>;
  let service: LeadApplicationService;

  let publish: jest.Mock;
  let updateLead: jest.Mock;

  beforeEach(() => {
    publish = jest.fn();
    updateLead = jest.fn();
    leadRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByPhone: jest.fn(),
      findByStage: jest.fn(),
      update: updateLead,
      changeStage: jest.fn(),
    };
    followUpRepository = {
      create: jest.fn(),
    };
    advancePaymentQuery = {
      hasConfirmedAdvance: jest.fn(),
    };
    eventPublisher = {
      publish,
    };

    service = new LeadApplicationService(
      leadRepository,
      followUpRepository,
      advancePaymentQuery,
      eventPublisher,
    );
  });

  it('creates a lead and publishes LeadCreated', async () => {
    leadRepository.create.mockResolvedValue(baseLead);

    const result = await service.createLead(tenantId, { source: 'website' });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(LeadCreatedEvent));
  });

  it('rejects negative estimated budget on create', async () => {
    const result = await service.createLead(tenantId, {
      source: 'website',
      estimatedBudgetAmount: -1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects invalid event date ranges on create', async () => {
    const result = await service.createLead(tenantId, {
      source: 'website',
      eventStartDate: new Date('2026-08-05'),
      eventEndDate: new Date('2026-08-01'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects update when lead is not found', async () => {
    leadRepository.findById.mockResolvedValue(null);

    const result = await service.updateLead(
      tenantId,
      leadId,
      { notes: 'Updated' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects update for terminal leads', async () => {
    leadRepository.findById.mockResolvedValue({
      ...baseLead,
      stage: 'completed',
    });

    const result = await service.updateLead(
      tenantId,
      leadId,
      { notes: 'Updated' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('rejects invalid event date ranges on update', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);

    const result = await service.updateLead(
      tenantId,
      leadId,
      {
        eventStartDate: new Date('2026-08-05'),
        eventEndDate: new Date('2026-08-01'),
      },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('rejects negative estimated budget on update', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);

    const result = await service.updateLead(
      tenantId,
      leadId,
      { estimatedBudgetAmount: -100 },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updates a lead with optimistic concurrency', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);
    updateLead.mockResolvedValue({
      ...baseLead,
      notes: 'Updated',
      version: 2,
    });

    const result = await service.updateLead(
      tenantId,
      leadId,
      { notes: 'Updated' },
      1,
    );

    expect(result.ok).toBe(true);
    expect(updateLead).toHaveBeenCalledWith(
      tenantId,
      leadId,
      { notes: 'Updated' },
      1,
    );
  });

  it('maps concurrent modification failures on update', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);
    updateLead.mockRejectedValue(
      new ConcurrentModificationError('Lead', leadId),
    );

    const result = await service.updateLead(
      tenantId,
      leadId,
      { notes: 'Updated' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });

  it('returns existing lead when stage is unchanged', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'new',
      version: 1,
    });

    expect(result.ok).toBe(true);
    expect(leadRepository.changeStage).not.toHaveBeenCalled();
  });

  it('rejects invalid stage transitions', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'approved',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('rejects stage change when lead is not found', async () => {
    leadRepository.findById.mockResolvedValue(null);

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'in_talks',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('changes lead stage and publishes LeadStageChanged', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);
    leadRepository.changeStage.mockResolvedValue({
      ...baseLead,
      stage: 'in_talks',
      version: 2,
    });

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'in_talks',
      version: 1,
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(LeadStageChangedEvent));
  });

  it('requires lostReason when moving to lost', async () => {
    leadRepository.findById.mockResolvedValue({
      ...baseLead,
      stage: 'in_talks',
    });

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'lost',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('enforces EP1-BR-001 before approving a lead', async () => {
    leadRepository.findById.mockResolvedValue({
      ...baseLead,
      stage: 'in_talks',
    });
    advancePaymentQuery.hasConfirmedAdvance.mockResolvedValue(false);

    const result = await service.changeLeadStage(tenantId, leadId, {
      stage: 'approved',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EP1-BR-001');
    }
  });

  it('rejects assignment when lead is not found', async () => {
    leadRepository.findById.mockResolvedValue(null);

    const result = await service.assignLead(tenantId, leadId, {
      assigneeId: 'user-1',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects assignment for terminal leads', async () => {
    leadRepository.findById.mockResolvedValue({
      ...baseLead,
      stage: 'lost',
    });

    const result = await service.assignLead(tenantId, leadId, {
      assigneeId: 'user-1',
      version: 1,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('assigns a lead and publishes LeadAssigned', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);
    updateLead.mockResolvedValue({
      ...baseLead,
      assignedToId: 'user-1',
      version: 2,
    });

    const result = await service.assignLead(tenantId, leadId, {
      assigneeId: 'user-1',
      version: 1,
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(LeadAssignedEvent));
  });

  it('rejects follow-up when lead is not found', async () => {
    leadRepository.findById.mockResolvedValue(null);

    const result = await service.scheduleFollowUp(tenantId, leadId, {
      dueAt: new Date('2026-08-10T10:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('rejects follow-up for terminal leads', async () => {
    leadRepository.findById.mockResolvedValue({
      ...baseLead,
      stage: 'completed',
    });

    const result = await service.scheduleFollowUp(tenantId, leadId, {
      dueAt: new Date('2026-08-10T10:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_STATE');
    }
  });

  it('schedules a follow-up and publishes FollowUpCreated', async () => {
    leadRepository.findById.mockResolvedValue(baseLead);
    followUpRepository.create.mockResolvedValue({
      id: 'follow-up-1',
      tenantId,
      leadId,
      dueAt: new Date('2026-08-10T10:00:00.000Z'),
      notes: 'Call back',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    });

    const result = await service.scheduleFollowUp(tenantId, leadId, {
      dueAt: new Date('2026-08-10T10:00:00.000Z'),
      notes: 'Call back',
    });

    expect(result.ok).toBe(true);
    expect(publish).toHaveBeenCalledWith(expect.any(FollowUpCreatedEvent));
  });
});
