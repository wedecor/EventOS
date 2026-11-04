import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { TimelineApplicationService } from '../src/modules/customer/application/services/timeline.application.service';
import { success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const CUSTOMER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EVENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const timelineDto = {
  id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  customerId: CUSTOMER_ID,
  eventId: EVENT_ID,
  type: 'note' as const,
  message: 'Called about setup',
  occurredAt: new Date('2026-07-13T10:00:00.000Z'),
  recordedByUserId: 'user-1',
  createdAt: new Date('2026-07-13T10:01:00.000Z'),
};

const createResult = {
  id: timelineDto.id,
  eventId: EVENT_ID,
  type: 'note' as const,
};

/**
 * EP1-CUS-002 — Customer Interactions API (`docs/09` §Customer timeline).
 * Application service stubbed so HTTP/auth/validation can be asserted without a DB.
 */
describe('Customer Interactions API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const timelineService = {
    listInteractions: jest.fn(),
    logInteraction: jest.fn(),
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
      .overrideProvider(TimelineApplicationService)
      .useValue(timelineService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    timelineService.listInteractions.mockResolvedValue(success([timelineDto]));
    timelineService.logInteraction.mockResolvedValue(success(createResult));
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /clients/:id/interactions requires authentication', () => {
    return request(app.getHttpServer())
      .get(`/api/v1/clients/${CUSTOMER_ID}/interactions`)
      .expect(401);
  });

  it('GET /clients/:id/interactions allows timeline:read (viewer)', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/clients/${CUSTOMER_ID}/interactions`)
      .set('Authorization', bearerFor('viewer'))
      .expect(200);

    const body = response.body as { data: unknown[] };
    expect(body.data).toHaveLength(1);
    expect(timelineService.listInteractions).toHaveBeenCalledWith(
      TENANT_ID,
      CUSTOMER_ID,
    );
  });

  it('GET /clients/:id/interactions forbids roles without timeline:read', () => {
    return request(app.getHttpServer())
      .get(`/api/v1/clients/${CUSTOMER_ID}/interactions`)
      .set('Authorization', bearerFor('sales'))
      .expect(403);
  });

  it('POST /clients/:id/interactions returns docs/09 create shape', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/interactions`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({
        eventId: EVENT_ID,
        type: 'note',
        message: 'Called about setup',
        occurredAt: '2026-07-13T10:00:00.000Z',
      })
      .expect(201);

    const body = response.body as {
      data: { id: string; eventId: string; type: string };
    };
    expect(body.data).toEqual(createResult);
    expect(timelineService.logInteraction).toHaveBeenCalledWith(
      TENANT_ID,
      CUSTOMER_ID,
      expect.objectContaining({
        eventId: EVENT_ID,
        type: 'note',
        message: 'Called about setup',
        recordedByUserId: 'user-1',
      }),
    );
  });

  it('POST /clients/:id/interactions forbids roles without timeline:write', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/clients/${CUSTOMER_ID}/interactions`)
      .set('Authorization', bearerFor('viewer'))
      .send({
        eventId: EVENT_ID,
        type: 'note',
        message: 'Called about setup',
        occurredAt: '2026-07-13T10:00:00.000Z',
      })
      .expect(403);
  });
});
