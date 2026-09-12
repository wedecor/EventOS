import { Injectable } from '@nestjs/common';
import type { FollowUp } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateFollowUpData,
  FollowUpRecord,
  FollowUpRepository,
  UpdateFollowUpData,
} from '../../domain/repositories/follow-up.repository';

@Injectable()
export class FollowUpRepositoryImpl
  extends TenantScopedRepository
  implements FollowUpRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(
    tenantId: string,
    data: CreateFollowUpData,
  ): Promise<FollowUpRecord> {
    const followUp = await this.prisma.followUp.create({
      data: {
        tenantId,
        leadId: data.leadId,
        dueAt: data.dueAt,
        notes: data.notes ?? null,
      },
    });

    return this.mapFollowUp(followUp);
  }

  async findById(tenantId: string, id: string): Promise<FollowUpRecord | null> {
    const followUp = await this.prisma.followUp.findFirst({
      where: { id, tenantId },
    });

    return followUp ? this.mapFollowUp(followUp) : null;
  }

  async listByLeadId(
    tenantId: string,
    leadId: string,
  ): Promise<FollowUpRecord[]> {
    const followUps = await this.prisma.followUp.findMany({
      where: { tenantId, leadId },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    });

    return followUps.map((followUp) => this.mapFollowUp(followUp));
  }

  async update(
    tenantId: string,
    id: string,
    data: UpdateFollowUpData,
    version: number,
  ): Promise<FollowUpRecord> {
    try {
      const followUp = await this.prisma.followUp.update({
        where: { id, tenantId, version },
        data: {
          dueAt: data.dueAt,
          notes: data.notes,
          status: data.status,
          version: { increment: 1 },
        },
      });

      return this.mapFollowUp(followUp);
    } catch (error: unknown) {
      this.toConcurrentModification('FollowUp', id, error);
    }
  }

  private mapFollowUp(followUp: FollowUp): FollowUpRecord {
    return {
      id: followUp.id,
      tenantId: followUp.tenantId,
      leadId: followUp.leadId,
      dueAt: followUp.dueAt,
      notes: followUp.notes,
      status: followUp.status,
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
      version: followUp.version,
    };
  }
}
