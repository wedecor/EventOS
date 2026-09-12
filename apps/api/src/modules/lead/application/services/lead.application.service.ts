import { Injectable } from '@nestjs/common';
import { AdvancePaymentQuery } from '../../../../shared/application/ports/advance-payment.query';
import { LeadConversionQuery } from '../../../../shared/application/ports/lead-conversion.query';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import {
  FollowUpCreatedEvent,
  LeadAssignedEvent,
  LeadCreatedEvent,
  LeadStageChangedEvent,
} from '../../../../shared/events/sprint1-domain.events';
import {
  isAllowedLeadStageTransition,
  isTerminalLeadStage,
} from '../../domain/lead-stage.rules';
import {
  FollowUpRepository,
  type FollowUpRecord,
} from '../../domain/repositories/follow-up.repository';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import {
  LeadRepository,
  type CreateLeadData,
  type LeadRecord,
  type UpdateLeadData,
} from '../../domain/repositories/lead.repository';
import { toFollowUpDto, type FollowUpDto } from '../dtos/follow-up.dto';
import {
  toLeadListItemDto,
  type LeadListItemDto,
} from '../dtos/lead-list-item.dto';
import { toLeadDto, type LeadDto } from '../dtos/lead.dto';

export type ListLeadsOptions = {
  includeCustomer?: boolean;
};

export type CreateLeadInput = CreateLeadData;
export type UpdateLeadInput = UpdateLeadData;

export type ChangeLeadStageInput = {
  stage: LeadRecord['stage'];
  version: number;
  lostReason?: string | null;
  changedById?: string | null;
  reason?: string | null;
};

export type AssignLeadInput = {
  assigneeId: string;
  version: number;
};

export type ScheduleFollowUpInput = {
  dueAt: Date;
  notes?: string | null;
};

@Injectable()
export class LeadApplicationService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly followUpRepository: FollowUpRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly advancePaymentQuery: AdvancePaymentQuery,
    private readonly leadConversionQuery: LeadConversionQuery,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async createLead(
    tenantId: string,
    input: CreateLeadInput,
  ): Promise<Result<LeadDto>> {
    const validation = this.validateLeadDates(
      input.eventStartDate,
      input.eventEndDate,
    );
    if (validation !== null) {
      return validation;
    }

    if (
      input.estimatedBudgetAmount !== undefined &&
      input.estimatedBudgetAmount !== null &&
      input.estimatedBudgetAmount < 0
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Estimated budget amount cannot be negative.',
      );
    }

    const lead = await this.leadRepository.create(tenantId, input);
    this.eventPublisher.publish(new LeadCreatedEvent(tenantId, lead));

    return success(toLeadDto(lead));
  }

  async updateLead(
    tenantId: string,
    leadId: string,
    input: UpdateLeadInput,
    version: number,
  ): Promise<Result<LeadDto>> {
    const existing = await this.leadRepository.findById(tenantId, leadId);
    if (!existing) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (isTerminalLeadStage(existing.stage)) {
      return failure(
        'INVALID_STATE',
        'Lead in a terminal stage cannot be updated.',
      );
    }

    const validation = this.validateLeadDates(
      input.eventStartDate,
      input.eventEndDate,
    );
    if (validation !== null) {
      return validation;
    }

    if (
      input.estimatedBudgetAmount !== undefined &&
      input.estimatedBudgetAmount !== null &&
      input.estimatedBudgetAmount < 0
    ) {
      return failure(
        'VALIDATION_ERROR',
        'Estimated budget amount cannot be negative.',
      );
    }

    try {
      const lead = await this.leadRepository.update(
        tenantId,
        leadId,
        input,
        version,
      );
      return success(toLeadDto(lead));
    } catch (error: unknown) {
      return this.handleConcurrency(error, leadId);
    }
  }

  async changeLeadStage(
    tenantId: string,
    leadId: string,
    input: ChangeLeadStageInput,
  ): Promise<Result<LeadDto>> {
    const existing = await this.leadRepository.findById(tenantId, leadId);
    if (!existing) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (existing.stage === input.stage) {
      return success(toLeadDto(existing));
    }

    if (!isAllowedLeadStageTransition(existing.stage, input.stage)) {
      return failure(
        'INVALID_TRANSITION',
        `Cannot transition lead from ${existing.stage} to ${input.stage}.`,
        { from: existing.stage, to: input.stage },
      );
    }

    if (input.stage === 'lost' && !input.lostReason?.trim()) {
      return failure(
        'VALIDATION_ERROR',
        'lostReason is required when moving a lead to lost.',
      );
    }

    if (input.stage === 'approved') {
      const hasAdvance = await this.advancePaymentQuery.hasConfirmedAdvance(
        tenantId,
        { leadId },
      );
      if (!hasAdvance) {
        return failure(
          'EP1-BR-001',
          'Advance payment must be confirmed before the lead can be approved.',
        );
      }

      const conversion = await this.leadConversionQuery.validateForApproval(
        tenantId,
        leadId,
      );
      if (!conversion.ok) {
        return conversion;
      }
    }

    try {
      const lead = await this.leadRepository.changeStage(
        tenantId,
        leadId,
        {
          stage: input.stage,
          lostReason: input.lostReason,
          changedById: input.changedById,
          reason: input.reason,
        },
        input.version,
      );

      this.eventPublisher.publish(
        new LeadStageChangedEvent(tenantId, lead, existing.stage),
      );

      return success(toLeadDto(lead));
    } catch (error: unknown) {
      return this.handleConcurrency(error, leadId);
    }
  }

  async assignLead(
    tenantId: string,
    leadId: string,
    input: AssignLeadInput,
  ): Promise<Result<LeadDto>> {
    const existing = await this.leadRepository.findById(tenantId, leadId);
    if (!existing) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (isTerminalLeadStage(existing.stage)) {
      return failure(
        'INVALID_STATE',
        'Lead in a terminal stage cannot be assigned.',
      );
    }

    try {
      const lead = await this.leadRepository.update(
        tenantId,
        leadId,
        { assignedToId: input.assigneeId },
        input.version,
      );

      this.eventPublisher.publish(
        new LeadAssignedEvent(tenantId, lead, input.assigneeId),
      );

      return success(toLeadDto(lead));
    } catch (error: unknown) {
      return this.handleConcurrency(error, leadId);
    }
  }

  async listLeads(
    tenantId: string,
    options: ListLeadsOptions = {},
  ): Promise<Result<LeadListItemDto[]>> {
    const leads = await this.leadRepository.listAll(tenantId);
    const dtos = leads.map(toLeadDto);

    if (!options.includeCustomer) {
      return success(dtos);
    }

    const customers = await this.customerRepository.listAll(tenantId);
    const nameById = new Map(
      customers.map((customer) => [customer.id, customer.displayName]),
    );

    return success(
      dtos.map((lead) =>
        toLeadListItemDto(
          lead,
          lead.customerId ? (nameById.get(lead.customerId) ?? null) : null,
        ),
      ),
    );
  }

  async listFollowUpsForLead(
    tenantId: string,
    leadId: string,
  ): Promise<Result<FollowUpDto[]>> {
    const lead = await this.leadRepository.findById(tenantId, leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    const followUps = await this.followUpRepository.listByLeadId(
      tenantId,
      leadId,
    );

    return success(followUps.map(toFollowUpDto));
  }

  async getLead(tenantId: string, leadId: string): Promise<Result<LeadDto>> {
    const lead = await this.leadRepository.findById(tenantId, leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    return success(toLeadDto(lead));
  }

  async updateFollowUp(
    tenantId: string,
    followUpId: string,
    input: {
      dueAt?: Date;
      notes?: string | null;
      status?: FollowUpRecord['status'];
    },
    version: number,
  ): Promise<Result<FollowUpDto>> {
    const existing = await this.followUpRepository.findById(
      tenantId,
      followUpId,
    );

    if (!existing) {
      return failure('NOT_FOUND', 'Follow-up not found.');
    }

    const lead = await this.leadRepository.findById(tenantId, existing.leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (isTerminalLeadStage(lead.stage)) {
      return failure(
        'INVALID_STATE',
        'Follow-ups cannot be updated for terminal leads.',
      );
    }

    try {
      const followUp = await this.followUpRepository.update(
        tenantId,
        followUpId,
        input,
        version,
      );

      return success(toFollowUpDto(followUp));
    } catch (error: unknown) {
      return this.handleConcurrency(error, followUpId);
    }
  }

  async scheduleFollowUp(
    tenantId: string,
    leadId: string,
    input: ScheduleFollowUpInput,
  ): Promise<Result<FollowUpDto>> {
    const lead = await this.leadRepository.findById(tenantId, leadId);
    if (!lead) {
      return failure('NOT_FOUND', 'Lead not found.');
    }

    if (isTerminalLeadStage(lead.stage)) {
      return failure(
        'INVALID_STATE',
        'Follow-ups cannot be scheduled for terminal leads.',
      );
    }

    const followUp = await this.followUpRepository.create(tenantId, {
      leadId,
      dueAt: input.dueAt,
      notes: input.notes,
    });

    this.eventPublisher.publish(new FollowUpCreatedEvent(tenantId, followUp));

    return success(toFollowUpDto(followUp));
  }

  private validateLeadDates(
    start?: Date | null,
    end?: Date | null,
  ): Result<LeadDto> | null {
    if (start && end && end < start) {
      return failure(
        'VALIDATION_ERROR',
        'Event end date must be on or after the start date.',
      );
    }

    return null;
  }

  private handleConcurrency<T>(error: unknown, leadId: string): Result<T> {
    if (error instanceof ConcurrentModificationError) {
      return failure(
        'CONCURRENT_MODIFICATION',
        'Lead was modified by another request. Reload and retry.',
        { leadId },
      );
    }

    throw error;
  }
}
