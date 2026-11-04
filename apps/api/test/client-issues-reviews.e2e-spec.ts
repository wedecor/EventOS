import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { TokenService } from '../src/modules/auth/application/services/token.service';
import { IssueApplicationService } from '../src/modules/customer/application/services/issue.application.service';
import { ReviewRequestApplicationService } from '../src/modules/customer/application/services/review-request.application.service';
import { failure, success } from '../src/shared/application/result';

const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const EVENT_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const ISSUE_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const REVIEW_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

/**
 * EP1-CUS-003 / EP1-CUS-004 — Issues & Review Requests (`docs/09` §Customer).
 * Application services stubbed for HTTP/auth/contract assertions.
 */
describe('Customer Issues & Review Requests API (e2e)', () => {
  let app: INestApplication<App>;
  let tokenService: TokenService;

  const issueService = { createIssueNote: jest.fn() };
  const reviewRequestService = { createReviewRequest: jest.fn() };

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
      .overrideProvider(IssueApplicationService)
      .useValue(issueService)
      .overrideProvider(ReviewRequestApplicationService)
      .useValue(reviewRequestService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();

    tokenService = app.get(TokenService, { strict: false });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    issueService.createIssueNote.mockResolvedValue(
      success({ id: ISSUE_ID, eventId: EVENT_ID, status: 'open' }),
    );
    reviewRequestService.createReviewRequest.mockResolvedValue(
      success({ id: REVIEW_ID, eventId: EVENT_ID, status: 'pending' }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /events/:eventId/issues requires authentication', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/issues`)
      .send({ message: 'Issue', severity: 'medium' })
      .expect(401);
  });

  it('POST /events/:eventId/issues allows issues:write (coordinator)', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/issues`)
      .set('Authorization', bearerFor('coordinator'))
      .send({
        message: 'Late setup',
        severity: 'high',
        notes: null,
      })
      .expect(201);

    const body = response.body as {
      data: { id: string; eventId: string; status: string };
    };
    expect(body.data).toEqual({
      id: ISSUE_ID,
      eventId: EVENT_ID,
      status: 'open',
    });
    expect(issueService.createIssueNote).toHaveBeenCalledWith(
      TENANT_ID,
      EVENT_ID,
      expect.objectContaining({ message: 'Late setup', severity: 'high' }),
    );
  });

  it('POST /events/:eventId/issues forbids roles without issues:write', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/issues`)
      .set('Authorization', bearerFor('sales_manager'))
      .send({ message: 'Issue', severity: 'low' })
      .expect(403);
  });

  it('POST /events/:eventId/review-requests returns docs/09 shape', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/review-requests`)
      .set('Authorization', bearerFor('sales_manager'))
      .send({ channel: 'google', channelDetail: null })
      .expect(201);

    const body = response.body as {
      data: { id: string; eventId: string; status: string };
    };
    expect(body.data).toEqual({
      id: REVIEW_ID,
      eventId: EVENT_ID,
      status: 'pending',
    });
  });

  it('POST /events/:eventId/review-requests forbids roles without reviews:write', () => {
    return request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/review-requests`)
      .set('Authorization', bearerFor('coordinator'))
      .send({ channel: 'google' })
      .expect(403);
  });

  it('POST /events/:eventId/review-requests maps duplicate to 409', async () => {
    reviewRequestService.createReviewRequest.mockResolvedValue(
      failure('DUPLICATE_REVIEW_REQUEST', 'Already exists.', {
        eventId: EVENT_ID,
      }),
    );

    await request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/review-requests`)
      .set('Authorization', bearerFor('sales_manager'))
      .send({ channel: 'instagram' })
      .expect(409);
  });

  it('POST /events/:eventId/issues rejects invalid body', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/events/${EVENT_ID}/issues`)
      .set('Authorization', bearerFor('operations_manager'))
      .send({ severity: 'high' })
      .expect(400);

    expect(issueService.createIssueNote).not.toHaveBeenCalled();
  });
});
