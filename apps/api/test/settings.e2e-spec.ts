import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { TenantSettingsApplicationService } from '../src/modules/tenant/application/services/tenant-settings.application.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const settingsDto = {
  id: '55555555-5555-5555-5555-555555555555',
  tenantId: TENANT_ID,
  businessName: 'We Decor Events',
  monthlyEventTarget: 12,
  monthlyRevenueTarget: 500000,
  monthlyLeadTarget: null,
  averageBookingTarget: null,
  conversionRateTarget: 0.35,
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  version: 1,
};

/**
 * R3-04 — Tenant Settings API (`docs/09-api-design.md` §Administration).
 */
describe('Tenant Settings API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const settingsService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  const bearerFor = (role: string): string => {
    const accessToken = tokenService.signAccessToken({
      userId: 'user-1',
      tenantId: TENANT_ID,
      email: `${role}@wedecor.test`,
      role,
    });
    return `Bearer ${accessToken}`;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue({
        ping: jest.fn().mockResolvedValue('PONG'),
        status: 'ready',
        quit: jest.fn().mockResolvedValue('OK'),
        connect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(TenantSettingsApplicationService)
      .useValue(settingsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    settingsService.getSettings.mockResolvedValue(success(settingsDto));
    settingsService.updateSettings.mockResolvedValue(
      success({ tenantId: TENANT_ID, updated: true as const }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/settings requires authentication', () => {
    return request(app.getHttpServer()).get('/api/v1/settings').expect(401);
  });

  it('GET /api/v1/settings allows owner (settings:read)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/settings')
      .set('Authorization', bearerFor('owner'))
      .expect(200);

    const body = response.body as { data: { businessName: string } };
    expect(body.data.businessName).toBe('We Decor Events');
  });

  it('GET /api/v1/settings forbids roles without settings:read', () => {
    return request(app.getHttpServer())
      .get('/api/v1/settings')
      .set('Authorization', bearerFor('operations_manager'))
      .expect(403);
  });

  it('PATCH /api/v1/settings requires If-Match', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/settings')
      .set('Authorization', bearerFor('admin'))
      .send({ monthlyEventTarget: 12 })
      .expect(400);

    const body = response.body as {
      code?: string;
      error?: { code?: string };
    };
    expect(body.code ?? body.error?.code).toBe('VALIDATION_ERROR');
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/settings returns docs/09 { tenantId, updated }', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/v1/settings')
      .set('Authorization', bearerFor('admin'))
      .set('If-Match', '1')
      .send({
        businessName: 'We Decor Events',
        monthlyEventTarget: 12,
        monthlyRevenueTarget: 500000,
        conversionRateTarget: 0.35,
      })
      .expect(200);

    const body = response.body as {
      data: { tenantId: string; updated: boolean };
    };
    expect(body.data).toEqual({ tenantId: TENANT_ID, updated: true });
    expect(settingsService.updateSettings).toHaveBeenCalledWith(
      TENANT_ID,
      expect.objectContaining({ monthlyEventTarget: 12 }),
      1,
    );
  });
});
