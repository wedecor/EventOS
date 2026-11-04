import { Injectable } from '@nestjs/common';
import type { NotificationPreference } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  NotificationPreferenceRecord,
  NotificationPreferenceRepository,
  UpsertNotificationPreferenceData,
} from '../../domain/repositories/notification-preference.repository';

@Injectable()
export class NotificationPreferenceRepositoryImpl
  extends TenantScopedRepository
  implements NotificationPreferenceRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<NotificationPreferenceRecord | null> {
    const row = await this.prisma.notificationPreference.findFirst({
      where: { tenantId, customerId },
    });
    return row ? this.map(row) : null;
  }

  async upsertForCustomer(
    tenantId: string,
    data: UpsertNotificationPreferenceData,
  ): Promise<NotificationPreferenceRecord> {
    const existing = await this.findByCustomerId(tenantId, data.customerId);
    if (existing) {
      const row = await this.prisma.notificationPreference.update({
        where: { id: existing.id },
        data: {
          whatsapp: data.whatsapp ?? existing.whatsapp,
          email: data.email ?? existing.email,
          sms: data.sms ?? existing.sms,
          version: { increment: 1 },
        },
      });
      return this.map(row);
    }

    const row = await this.prisma.notificationPreference.create({
      data: {
        tenant: { connect: { id: tenantId } },
        customer: { connect: { id: data.customerId } },
        whatsapp: data.whatsapp ?? true,
        email: data.email ?? true,
        sms: data.sms ?? false,
      },
    });
    return this.map(row);
  }

  private map(row: NotificationPreference): NotificationPreferenceRecord {
    return {
      id: row.id,
      tenantId: row.tenantId,
      customerId: row.customerId,
      userId: row.userId,
      whatsapp: row.whatsapp,
      email: row.email,
      sms: row.sms,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      version: row.version,
    };
  }
}
