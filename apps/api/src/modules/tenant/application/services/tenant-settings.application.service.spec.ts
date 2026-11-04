import { ConcurrentModificationError } from '../../../../shared/database';
import { TenantSettingsUpdatedEvent } from '../../../../shared/events/sprint2-domain.events';
import { TenantSettingsApplicationService } from './tenant-settings.application.service';
import type {
  TenantSettingsRecord,
  TenantSettingsRepository,
} from '../../domain/repositories/tenant-settings.repository';

describe('TenantSettingsApplicationService', () => {
  const tenantId = 'tenant-1';

  const baseSettings: TenantSettingsRecord = {
    id: 'settings-1',
    tenantId,
    businessName: 'We Decor Events',
    monthlyEventTarget: null,
    monthlyRevenueTarget: null,
    monthlyLeadTarget: null,
    averageBookingTarget: null,
    conversionRateTarget: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  let tenantSettingsRepository: jest.Mocked<TenantSettingsRepository>;
  let publish: jest.Mock;
  let service: TenantSettingsApplicationService;

  beforeEach(() => {
    publish = jest.fn();
    tenantSettingsRepository = {
      findByTenantId: jest.fn(),
      update: jest.fn(),
    };

    service = new TenantSettingsApplicationService(tenantSettingsRepository, {
      publish,
    });
  });

  it('getSettings returns NOT_FOUND when missing', async () => {
    tenantSettingsRepository.findByTenantId.mockResolvedValue(null);

    const result = await service.getSettings(tenantId);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('NOT_FOUND');
    }
  });

  it('getSettings returns the settings DTO', async () => {
    tenantSettingsRepository.findByTenantId.mockResolvedValue(baseSettings);

    const result = await service.getSettings(tenantId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.businessName).toBe('We Decor Events');
      expect(result.value.version).toBe(1);
    }
  });

  it('updateSettings rejects blank businessName', async () => {
    tenantSettingsRepository.findByTenantId.mockResolvedValue(baseSettings);

    const result = await service.updateSettings(
      tenantId,
      { businessName: '  ' },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateSettings rejects negative monthlyEventTarget', async () => {
    tenantSettingsRepository.findByTenantId.mockResolvedValue(baseSettings);

    const result = await service.updateSettings(
      tenantId,
      { monthlyEventTarget: -1 },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('updateSettings returns docs/09 PATCH shape and publishes event', async () => {
    const updated: TenantSettingsRecord = {
      ...baseSettings,
      monthlyEventTarget: 12,
      monthlyRevenueTarget: 500000,
      conversionRateTarget: 0.35,
      version: 2,
    };
    tenantSettingsRepository.findByTenantId.mockResolvedValue(baseSettings);
    tenantSettingsRepository.update.mockResolvedValue(updated);

    const result = await service.updateSettings(
      tenantId,
      {
        monthlyEventTarget: 12,
        monthlyRevenueTarget: 500000,
        conversionRateTarget: 0.35,
      },
      1,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ tenantId, updated: true });
    }
    expect(publish).toHaveBeenCalledWith(
      expect.any(TenantSettingsUpdatedEvent),
    );
  });

  it('updateSettings maps ConcurrentModificationError', async () => {
    tenantSettingsRepository.findByTenantId.mockResolvedValue(baseSettings);
    tenantSettingsRepository.update.mockRejectedValue(
      new ConcurrentModificationError('TenantSettings', tenantId),
    );

    const result = await service.updateSettings(
      tenantId,
      { monthlyLeadTarget: 40 },
      1,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('CONCURRENT_MODIFICATION');
    }
  });
});
