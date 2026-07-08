import { Injectable } from '@nestjs/common';
import type { Lead, LeadStage, Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ConcurrentModificationError,
  TenantScopedRepository,
} from '../../../../shared/database';
import type {
  ChangeLeadStageData,
  CreateLeadData,
  LeadRecord,
  LeadRepository,
  UpdateLeadData,
} from '../../domain/repositories/lead.repository';

@Injectable()
export class LeadRepositoryImpl
  extends TenantScopedRepository
  implements LeadRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(tenantId: string, data: CreateLeadData): Promise<LeadRecord> {
    const lead = await this.prisma.lead.create({
      data: this.toCreateInput(tenantId, data),
    });

    return this.mapLead(lead);
  }

  async findById(tenantId: string, id: string): Promise<LeadRecord | null> {
    const lead = await this.prisma.lead.findFirst({
      where: { id, tenantId },
    });

    return lead ? this.mapLead(lead) : null;
  }

  async findByPhone(tenantId: string, phone: string): Promise<LeadRecord[]> {
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId,
        customer: {
          primaryPhone: phone,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return leads.map((lead) => this.mapLead(lead));
  }

  async findByStage(tenantId: string, stage: LeadStage): Promise<LeadRecord[]> {
    const leads = await this.prisma.lead.findMany({
      where: { tenantId, stage },
      orderBy: { updatedAt: 'desc' },
    });

    return leads.map((lead) => this.mapLead(lead));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateLeadData,
    version: number,
  ): Promise<LeadRecord> {
    try {
      const lead = await this.prisma.lead.update({
        where: { id, tenantId, version },
        data: {
          ...this.toUpdateInput(data),
          version: { increment: 1 },
        },
      });

      return this.mapLead(lead);
    } catch (error: unknown) {
      return this.toConcurrentModification('Lead', id, error);
    }
  }

  async changeStage(
    tenantId: string,
    id: string,
    data: ChangeLeadStageData,
    version: number,
  ): Promise<LeadRecord> {
    const existing = await this.findById(tenantId, id);
    if (!existing) {
      throw new ConcurrentModificationError('Lead', id);
    }

    try {
      const lead = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.lead.update({
          where: { id, tenantId, version },
          data: {
            stage: data.stage,
            lostReason: data.lostReason ?? undefined,
            version: { increment: 1 },
          },
        });

        await tx.leadStageHistory.create({
          data: {
            tenantId,
            leadId: id,
            fromStage: existing.stage,
            toStage: data.stage,
            reason: data.reason ?? data.lostReason ?? null,
            changedById: data.changedById ?? null,
          },
        });

        return updated;
      });

      return this.mapLead(lead);
    } catch (error: unknown) {
      return this.toConcurrentModification('Lead', id, error);
    }
  }

  private toCreateInput(
    tenantId: string,
    data: CreateLeadData,
  ): Prisma.LeadCreateInput {
    return {
      tenant: { connect: { id: tenantId } },
      customer: data.customerId
        ? { connect: { id: data.customerId } }
        : undefined,
      assignedTo: data.assignedToId
        ? { connect: { id: data.assignedToId } }
        : undefined,
      source: data.source,
      sourceDetail: data.sourceDetail ?? null,
      eventType: data.eventType ?? null,
      eventStartDate: data.eventStartDate ?? null,
      eventEndDate: data.eventEndDate ?? null,
      venue: data.venue ?? null,
      estimatedBudgetAmount: data.estimatedBudgetAmount ?? null,
      estimatedBudgetCurrency: data.estimatedBudgetCurrency ?? 'INR',
      guestCount: data.guestCount ?? null,
      notes: data.notes ?? null,
    };
  }

  private toUpdateInput(data: UpdateLeadData): Prisma.LeadUpdateInput {
    return {
      customer:
        data.customerId === undefined
          ? undefined
          : data.customerId === null
            ? { disconnect: true }
            : { connect: { id: data.customerId } },
      assignedTo:
        data.assignedToId === undefined
          ? undefined
          : data.assignedToId === null
            ? { disconnect: true }
            : { connect: { id: data.assignedToId } },
      sourceDetail: data.sourceDetail,
      eventType: data.eventType,
      eventStartDate: data.eventStartDate,
      eventEndDate: data.eventEndDate,
      venue: data.venue,
      estimatedBudgetAmount: data.estimatedBudgetAmount,
      estimatedBudgetCurrency: data.estimatedBudgetCurrency,
      guestCount: data.guestCount,
      notes: data.notes,
    };
  }

  private mapLead(lead: Lead): LeadRecord {
    return {
      id: lead.id,
      tenantId: lead.tenantId,
      customerId: lead.customerId,
      assignedToId: lead.assignedToId,
      source: lead.source,
      sourceDetail: lead.sourceDetail,
      stage: lead.stage,
      lostReason: lead.lostReason,
      eventType: lead.eventType,
      eventStartDate: lead.eventStartDate,
      eventEndDate: lead.eventEndDate,
      venue: lead.venue,
      estimatedBudgetAmount: this.toNumber(lead.estimatedBudgetAmount),
      estimatedBudgetCurrency: lead.estimatedBudgetCurrency,
      guestCount: lead.guestCount,
      notes: lead.notes,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      version: lead.version,
    };
  }
}
