import { TenantSettingsRepositoryImpl } from './tenant-settings.repository.impl';

describe('TenantSettingsRepositoryImpl', () => {
  const tenantId = 'tenant-1';

  const prismaSettings = {
    id: 'settings-1',
    tenantId,
    businessName: 'We Decor Events',
    monthlyEventTarget: 10,
    monthlyRevenueTarget: { toNumber: () => 100000 },
    monthlyLeadTarget: null,
    averageBookingTarget: null,
    conversionRateTarget: { toNumber: () => 0.25 },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  const prisma = {
    tenantSettings: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  let repository: TenantSettingsRepositoryImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TenantSettingsRepositoryImpl(prisma as never);
  });

  it('findByTenantId maps decimal fields to numbers', async () => {
    prisma.tenantSettings.findUnique.mockResolvedValue(prismaSettings);

    const result = await repository.findByTenantId(tenantId);

    expect(result?.monthlyRevenueTarget).toBe(100000);
    expect(result?.conversionRateTarget).toBe(0.25);
    expect(prisma.tenantSettings.findUnique).toHaveBeenCalledWith({
      where: { tenantId },
    });
  });

  it('update increments version with tenantId + version concurrency guard', async () => {
    prisma.tenantSettings.update.mockResolvedValue({
      ...prismaSettings,
      monthlyEventTarget: 12,
      version: 2,
    });

    const result = await repository.update(
      tenantId,
      { monthlyEventTarget: 12 },
      1,
    );

    expect(result.version).toBe(2);
    expect(prisma.tenantSettings.update).toHaveBeenCalledWith({
      where: { tenantId, version: 1 },
      data: expect.objectContaining({
        monthlyEventTarget: 12,
        version: { increment: 1 },
      }),
    });
  });
});
