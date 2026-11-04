import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { SuggestionApplicationService } from '../src/modules/admin/application/services/suggestion.application.service';
import { failure, success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const suggestionDto = {
  id: '33333333-3333-3333-3333-333333333333',
  tenantId: TENANT_ID,
  type: 'workspace.create',
  status: 'pending' as const,
  aggregateType: 'booking',
  aggregateId: '44444444-4444-4444-4444-444444444444',
  payload: { version: 1 },
  sourceEventId: null,
  comment: null,
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  resolvedAt: null,
  resolvedBy: null,
};

/**
 * R3-03 / ADR-017 — Suggestion accept/dismiss queue
 * (`docs/09-api-design.md` §Administration — Suggestions).
 */
describe('Suggestions API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const suggestionService = {
    listSuggestions: jest.fn(),
    acceptSuggestion: jest.fn(),
    dismissSuggestion: jest.fn(),
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
      .overrideProvider(SuggestionApplicationService)
      .useValue(suggestionService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    suggestionService.listSuggestions.mockResolvedValue(
      success([suggestionDto]),
    );
    suggestionService.acceptSuggestion.mockResolvedValue(
      success({ ...suggestionDto, status: 'accepted' }),
    );
    suggestionService.dismissSuggestion.mockResolvedValue(
      success({ ...suggestionDto, status: 'dismissed' }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/suggestions requires authentication', () => {
    return request(app.getHttpServer()).get('/api/v1/suggestions').expect(401);
  });

  it('GET /api/v1/suggestions allows suggestions:read', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/suggestions?status=pending')
      .set('Authorization', bearerFor('operations_manager'))
      .expect(200);

    const body = response.body as { data: unknown[] };
    expect(body.data).toHaveLength(1);
    expect(suggestionService.listSuggestions).toHaveBeenCalled();
  });

  it('POST /api/v1/suggestions/:id/accept requires suggestions:accept', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/suggestions/${suggestionDto.id}/accept`)
      .set('Authorization', bearerFor('viewer'))
      .send({})
      .expect(403);
  });

  it('POST /api/v1/suggestions/:id/accept succeeds for operations_manager', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/suggestions/${suggestionDto.id}/accept`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({ comment: 'activate now' })
      .expect(200);

    const body = response.body as { data: { status: string } };
    expect(body.data.status).toBe('accepted');
    expect(suggestionService.acceptSuggestion).toHaveBeenCalledWith(
      TENANT_ID,
      suggestionDto.id,
      expect.objectContaining({
        comment: 'activate now',
        actorRole: 'operations_manager',
      }),
    );
  });

  it('POST /api/v1/suggestions/:id/dismiss does not auto-execute business actions', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/suggestions/${suggestionDto.id}/dismiss`)
      .set('Authorization', bearerFor('owner'))
      .send({ comment: 'skip' })
      .expect(200);

    const body = response.body as { data: { status: string } };
    expect(body.data.status).toBe('dismissed');
    expect(suggestionService.acceptSuggestion).not.toHaveBeenCalled();
  });

  it('surfaces NOT_IMPLEMENTED from checklist.generate accept', async () => {
    suggestionService.acceptSuggestion.mockResolvedValue(
      failure('NOT_IMPLEMENTED', 'Checklist generation is not available yet.'),
    );

    const response = await request(app.getHttpServer())
      .post(`/api/v1/suggestions/${suggestionDto.id}/accept`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({})
      .expect(501);

    const body = response.body as {
      code?: string;
      error?: { code?: string };
    };
    expect(body.code ?? body.error?.code).toBe('NOT_IMPLEMENTED');
  });
});
