import type { TenantSettingsRecord } from '../../domain/repositories/tenant-settings.repository';

export type TenantSettingsDto = {
  id: string;
  tenantId: string;
  businessName: string;
  monthlyEventTarget: number | null;
  monthlyRevenueTarget: number | null;
  monthlyLeadTarget: number | null;
  averageBookingTarget: number | null;
  conversionRateTarget: number | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type TenantSettingsUpdateResultDto = {
  tenantId: string;
  updated: true;
};

export function toTenantSettingsDto(
  record: TenantSettingsRecord,
): TenantSettingsDto {
  return { ...record };
}
