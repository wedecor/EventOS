import { Injectable } from '@nestjs/common';
import type { TenantSettings } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { TenantScopedRepository } from '../../../../shared/database';
import type {
  TenantSettingsRecord,
  TenantSettingsRepository,
  UpdateTenantSettingsData,
} from '../../domain/repositories/tenant-settings.repository';

@Injectable()
export class TenantSettingsRepositoryImpl
  extends TenantScopedRepository
  implements TenantSettingsRepository
{
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findByTenantId(tenantId: string): Promise<TenantSettingsRecord | null> {
    const settings = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    return settings ? this.mapRecord(settings) : null;
  }

  async update(
    tenantId: string,
    data: UpdateTenantSettingsData,
    version: number,
  ): Promise<TenantSettingsRecord> {
    try {
      const settings = await this.prisma.tenantSettings.update({
        where: { tenantId, version },
        data: {
          businessName: data.businessName,
          monthlyEventTarget: data.monthlyEventTarget,
          monthlyRevenueTarget: data.monthlyRevenueTarget,
          monthlyLeadTarget: data.monthlyLeadTarget,
          averageBookingTarget: data.averageBookingTarget,
          conversionRateTarget: data.conversionRateTarget,
          version: { increment: 1 },
        },
      });

      return this.mapRecord(settings);
    } catch (error: unknown) {
      return this.toConcurrentModification('TenantSettings', tenantId, error);
    }
  }

  private mapRecord(settings: TenantSettings): TenantSettingsRecord {
    return {
      id: settings.id,
      tenantId: settings.tenantId,
      businessName: settings.businessName,
      monthlyEventTarget: settings.monthlyEventTarget,
      monthlyRevenueTarget: toNumberOrNull(settings.monthlyRevenueTarget),
      monthlyLeadTarget: settings.monthlyLeadTarget,
      averageBookingTarget: toNumberOrNull(settings.averageBookingTarget),
      conversionRateTarget: toNumberOrNull(settings.conversionRateTarget),
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
      version: settings.version,
    };
  }
}

function toNumberOrNull(
  value: { toNumber: () => number } | null,
): number | null {
  if (value === null) {
    return null;
  }
  return value.toNumber();
}
