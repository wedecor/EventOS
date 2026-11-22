import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { LeadApplicationService } from '../src/modules/lead/application/services/lead.application.service';
import { QuotationApplicationService } from '../src/modules/quotation/application/services/quotation.application.service';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Verifies C4 endpoint-level authorization (docs/14 §Authorization, docs/09 per-endpoint
 * contracts) end-to-end through the globally-registered PermissionsGuard:
 * - a role holding the required permission passes (200);
 * - a role missing it is rejected with 403 FORBIDDEN;
 * - admin passes everywhere;
 * - role-specific endpoints (quotation approve) admit only the documented roles.
 *
 * Business application services are stubbed so authorized requests resolve past the
 * controller without a real database; the guard runs before the handler, so 403s never
 * reach the stubbed service.
 */
describe('Authorization guard (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

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
      .overrideProvider(LeadApplicationService)
      .useValue({ listLeads: jest.fn().mockResolvedValue(success([])) })
      .overrideProvider(QuotationApplicationService)
      .useValue({
        approveQuotation: jest
          .fn()
          .mockResolvedValue(success({ id: 'q-1', eventId: null })),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows a role that holds the required permission (leads:read)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', bearerFor('viewer'))
      .expect(200);
  });

  it('grants admin access to a permission-gated read', () => {
    return request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', bearerFor('admin'))
      .expect(200);
  });

  it('rejects a role missing the required permission with 403', () => {
    // marketing has no documented Phase 1 API permissions.
    return request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', bearerFor('marketing'))
      .expect(403);
  });

  it('still returns 401 (not 403) when no token is provided', () => {
    return request(app.getHttpServer()).get('/api/v1/leads').expect(401);
  });

  it('admits a documented role on a role-specific endpoint (quotations:approve)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/quotations/q-1/approve')
      .set('Authorization', bearerFor('operations_manager'))
      .expect(201);
  });

  it('forbids an undocumented role on a role-specific endpoint (quotations:approve)', () => {
    return request(app.getHttpServer())
      .post('/api/v1/quotations/q-1/approve')
      .set('Authorization', bearerFor('sales'))
      .expect(403);
  });
});
