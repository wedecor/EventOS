import { IntegrationSettingsApplicationService } from './integration-settings.application.service';

describe('IntegrationSettingsApplicationService', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const actorId = '11111111-1111-4111-8111-111111111111';

  let service: IntegrationSettingsApplicationService;
  let repository: {
    findByTenantId: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  let auditLog: { record: jest.Mock };
  let config: { get: jest.Mock };
  let mail: { providerName: string; send: jest.Mock };
  let storage: {
    providerName: string;
    put: jest.Mock;
    get: jest.Mock;
    delete: jest.Mock;
  };

  const baseSettings = {
    id: 'settings-1',
    tenantId,
    emailProvider: 'test',
    fromName: 'We Decor Events',
    fromEmail: 'ops@wedecor.events',
    smtpUser: null,
    smtpPasswordEncrypted: null,
    emailSecretConfigured: false,
    storageProvider: 'local',
    storageBucket: null,
    storageEndpoint: null,
    storageAccessKey: null,
    storageSecretEncrypted: null,
    storageSecretConfigured: false,
    lastEmailTestAt: null,
    lastEmailTestStatus: null,
    lastStorageTestAt: null,
    lastStorageTestStatus: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };

  beforeEach(() => {
    repository = {
      findByTenantId: jest.fn().mockResolvedValue(baseSettings),
      create: jest.fn(),
      update: jest.fn().mockImplementation(async (_t, data, version) => ({
        ...baseSettings,
        ...data,
        version: version + 1,
      })),
    };
    auditLog = { record: jest.fn().mockResolvedValue(undefined) };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') {
          return 'e2e-only-jwt-secret-at-least-32-characters-long';
        }
        if (key === 'MAIL_PROVIDER') return 'test';
        if (key === 'STORAGE_PROVIDER') return 'local';
        return undefined;
      }),
    };
    mail = {
      providerName: 'test',
      send: jest.fn().mockResolvedValue({
        accepted: true,
        provider: 'test',
        providerMessageId: 'test-1',
        status: 'accepted',
      }),
    };
    storage = {
      providerName: 'local',
      put: jest.fn().mockResolvedValue(undefined),
      get: jest
        .fn()
        .mockResolvedValue({ body: Buffer.from('eventos-storage-connection-test') }),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    service = new IntegrationSettingsApplicationService(
      repository as never,
      auditLog as never,
      config as never,
      mail as never,
      storage as never,
    );
  });

  it('getSettings never returns ciphertext or plaintext secrets', async () => {
    repository.findByTenantId.mockResolvedValue({
      ...baseSettings,
      emailSecretConfigured: true,
      smtpPasswordEncrypted: 'v1.should-never-leak',
      storageSecretConfigured: true,
      storageSecretEncrypted: 'v1.should-never-leak',
    });

    const result = await service.getSettings(tenantId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.emailSecretMasked).toBe('••••••••');
    expect(result.value.storageSecretMasked).toBe('••••••••');
    expect(JSON.stringify(result.value)).not.toContain('should-never-leak');
    expect(result.value).not.toHaveProperty('smtpPassword');
    expect(result.value).not.toHaveProperty('smtpPasswordEncrypted');
    expect(result.value).not.toHaveProperty('storageSecretKey');
    expect(result.value).not.toHaveProperty('storageSecretEncrypted');
  });

  it('updateSettings sets configured flags without claiming connection', async () => {
    const result = await service.updateSettings(
      tenantId,
      {
        emailProvider: 'test',
        fromEmail: 'ops@wedecor.events',
        smtpPassword: 'new-secret-password',
      },
      1,
      actorId,
    );
    expect(result.ok).toBe(true);
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({
        emailSecretConfigured: true,
        smtpPasswordEncrypted: expect.stringMatching(/^v1\./),
      }),
      1,
    );
    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ connectionClaimed: false }),
      }),
    );
  });

  it('testEmail records ok only after provider acceptance', async () => {
    const result = await service.testEmail(tenantId, actorId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('ok');
    expect(result.value.message).toMatch(/not delivery proof/i);
    expect(repository.update).toHaveBeenCalledWith(
      tenantId,
      expect.objectContaining({ lastEmailTestStatus: 'ok' }),
      1,
    );
  });

  it('testStorage probes put/get/delete and records status', async () => {
    const result = await service.testStorage(tenantId, actorId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe('ok');
    expect(storage.put).toHaveBeenCalled();
    expect(storage.get).toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalled();
  });
});
