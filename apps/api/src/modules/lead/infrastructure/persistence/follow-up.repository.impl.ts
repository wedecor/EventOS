import { Injectable } from '@nestjs/common';
import type { FollowUp } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  CreateFollowUpData,
  FollowUpRecord,
  FollowUpRepository,
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
