export type TenantSettingsRecord = {
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

export type UpdateTenantSettingsData = {
  businessName?: string;
  monthlyEventTarget?: number | null;
  monthlyRevenueTarget?: number | null;
  monthlyLeadTarget?: number | null;
  averageBookingTarget?: number | null;
  conversionRateTarget?: number | null;
};

export abstract class TenantSettingsRepository {
  abstract findByTenantId(
    tenantId: string,
  ): Promise<TenantSettingsRecord | null>;

  abstract update(
    tenantId: string,
    data: UpdateTenantSettingsData,
    version: number,
  ): Promise<TenantSettingsRecord>;
}
