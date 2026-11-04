import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { ConcurrentModificationError } from '../../../../shared/database';
import { DomainEventPublisher } from '../../../../shared/events/domain-event.base';
import { TenantSettingsUpdatedEvent } from '../../../../shared/events/sprint2-domain.events';
import { TenantSettingsRepository } from '../../domain/repositories/tenant-settings.repository';
import {
  toTenantSettingsDto,
  type TenantSettingsDto,
  type TenantSettingsUpdateResultDto,
} from '../dtos/tenant-settings.dto';

export type UpdateTenantSettingsInput = {
  businessName?: string;
  monthlyEventTarget?: number | null;
  monthlyRevenueTarget?: number | null;
  monthlyLeadTarget?: number | null;
  averageBookingTarget?: number | null;
  conversionRateTarget?: number | null;
};

// R3-04 / EP1-KPI-007 — Phase 1 tenant settings (founder KPI targets + business name).
// docs/09 §Administration GET/PATCH /api/v1/settings. ADR-016 single-tenant scoping.
@Injectable()
export class TenantSettingsApplicationService {
  constructor(
    private readonly tenantSettingsRepository: TenantSettingsRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async getSettings(tenantId: string): Promise<Result<TenantSettingsDto>> {
    const settings =
      await this.tenantSettingsRepository.findByTenantId(tenantId);
    if (!settings) {
      return failure('NOT_FOUND', 'Tenant settings not found.');
    }

    return success(toTenantSettingsDto(settings));
  }

  async updateSettings(
    tenantId: string,
    input: UpdateTenantSettingsInput,
    version: number,
  ): Promise<Result<TenantSettingsUpdateResultDto>> {
    const existing =
      await this.tenantSettingsRepository.findByTenantId(tenantId);
    if (!existing) {
      return failure('NOT_FOUND', 'Tenant settings not found.');
    }

    if (input.businessName !== undefined && !input.businessName.trim()) {
      return failure('VALIDATION_ERROR', 'Business name cannot be blank.');
    }

    const countError = this.validateOptionalNonNegativeInt(
      'monthlyEventTarget',
      input.monthlyEventTarget,
    );
    if (countError) {
      return countError;
    }

    const leadError = this.validateOptionalNonNegativeInt(
      'monthlyLeadTarget',
      input.monthlyLeadTarget,
    );
    if (leadError) {
      return leadError;
    }

    const revenueError = this.validateOptionalNonNegativeNumber(
      'monthlyRevenueTarget',
      input.monthlyRevenueTarget,
    );
    if (revenueError) {
      return revenueError;
    }

    const bookingError = this.validateOptionalNonNegativeNumber(
      'averageBookingTarget',
      input.averageBookingTarget,
    );
    if (bookingError) {
      return bookingError;
    }

    const conversionError = this.validateOptionalNonNegativeNumber(
      'conversionRateTarget',
      input.conversionRateTarget,
    );
    if (conversionError) {
      return conversionError;
    }

    try {
      const settings = await this.tenantSettingsRepository.update(
        tenantId,
        {
          businessName: input.businessName?.trim(),
          monthlyEventTarget: input.monthlyEventTarget,
          monthlyRevenueTarget: input.monthlyRevenueTarget,
          monthlyLeadTarget: input.monthlyLeadTarget,
          averageBookingTarget: input.averageBookingTarget,
          conversionRateTarget: input.conversionRateTarget,
        },
        version,
      );

      this.eventPublisher.publish(
        new TenantSettingsUpdatedEvent(tenantId, settings),
      );

      return success({ tenantId: settings.tenantId, updated: true });
    } catch (error: unknown) {
      if (error instanceof ConcurrentModificationError) {
        return failure(
          'CONCURRENT_MODIFICATION',
          'Tenant settings were modified by another request. Reload and retry.',
          { tenantId },
        );
      }
      throw error;
    }
  }

  private validateOptionalNonNegativeInt(
    field: string,
    value: number | null | undefined,
  ): Result<never> | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Number.isInteger(value) || value < 0) {
      return failure(
        'VALIDATION_ERROR',
        `${field} must be a non-negative integer.`,
        { [field]: value },
      );
    }
    return null;
  }

  private validateOptionalNonNegativeNumber(
    field: string,
    value: number | null | undefined,
  ): Result<never> | null {
    if (value === undefined || value === null) {
      return null;
    }
    if (!Number.isFinite(value) || value < 0) {
      return failure(
        'VALIDATION_ERROR',
        `${field} must be a non-negative number.`,
        { [field]: value },
      );
    }
    return null;
  }
}
