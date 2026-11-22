import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { REDIS_CLIENT } from '../../src/database/redis.constants';
import { REFRESH_COOKIE_NAME } from '../../src/auth/auth.constants';

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

(runIntegration ? describe : describe.skip)('Auth (integration)', () => {
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
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api/v1', {
      exclude: ['health', 'health/ready'],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login, refresh, and load profile', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@wedecor.events',
        password: 'ChangeMe!EventOS1',
      })
      .expect(201);

    const loginBody = loginResponse.body as {
      data: { accessToken: string };
    };

    expect(loginBody.data.accessToken).toBeTruthy();

    const setCookie = loginResponse.headers['set-cookie'] as
      string | string[] | undefined;
    const cookieHeader: string[] = Array.isArray(setCookie)
      ? setCookie
      : setCookie
        ? [setCookie]
        : [];
    const refreshCookie = cookieHeader.find((value: string) =>
      value.startsWith(`${REFRESH_COOKIE_NAME}=`),
    );
    expect(refreshCookie).toBeDefined();

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie as string)
      .expect(201);

    const refreshBody = refreshResponse.body as {
      data: { accessToken: string };
    };

    expect(refreshBody.data.accessToken).toBeTruthy();
    expect(refreshBody.data.accessToken).not.toBe(loginBody.data.accessToken);
  });
});
