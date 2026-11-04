import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';

/**
 * Verifies the Step 2 global-guard protection matrix (ADR-008):
 * - documented public endpoints are reachable without a token;
 * - every other endpoint requires a valid access token.
 *
 * The global JwtAuthGuard runs before controller handlers, so protected-route
 * rejections return 401 without touching the database.
 */
describe('Authentication guard (e2e)', () => {
  let app: INestApplication<App>;

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
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows the public health probe without a token', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('rejects a protected endpoint when no token is provided', () => {
    return request(app.getHttpServer()).get('/api/v1/leads').expect(401);
  });

  it('rejects a protected endpoint when the bearer token is invalid', () => {
    return request(app.getHttpServer())
      .get('/api/v1/leads')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('does not require a token to reach the public login endpoint', async () => {
    // Reaches the handler (not 401); invalid body yields a 400 validation error.
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email' });

    expect(response.status).not.toBe(401);
    expect(response.status).toBe(400);
  });
});
