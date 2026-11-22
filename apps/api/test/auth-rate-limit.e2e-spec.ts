import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { REDIS_CLIENT } from '../src/database/redis.constants';
import { UserRepository } from '../src/modules/auth/domain/repositories/user.repository';

/**
 * R1-05 (docs/14 §Brute Force Protection) end-to-end: 5 failed logins for one
 * email within the window produce a 429 lockout that persists across further
 * attempts, is isolated per email, and does NOT throttle any other endpoint.
 *
 * A small stateful in-memory Redis fake stands in for the real client so the
 * lockout state is exercised through the actual repository/service wiring
 * (LoginAttemptRepositoryImpl → LoginThrottleService → AuthApplicationService).
 * UserRepository is stubbed to always miss, so every attempt is a genuine
 * failed login without needing a database.
 */
class FakeRedis {
  private store = new Map<string, { value: string; expireAt: number | null }>();

  private live(key: string): { value: string; expireAt: number | null } | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expireAt !== null && entry.expireAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  incr(key: string): Promise<number> {
    const entry = this.live(key) ?? { value: '0', expireAt: null };
    const next = Number(entry.value) + 1;
    this.store.set(key, { value: String(next), expireAt: entry.expireAt });
    return Promise.resolve(next);
  }

  expire(key: string, seconds: number): Promise<number> {
    const entry = this.live(key);
    if (!entry) {
      return Promise.resolve(0);
    }
    entry.expireAt = Date.now() + seconds * 1000;
    this.store.set(key, entry);
    return Promise.resolve(1);
  }

  set(key: string, value: string, _ex: 'EX', seconds: number): Promise<'OK'> {
    this.store.set(key, { value, expireAt: Date.now() + seconds * 1000 });
    return Promise.resolve('OK');
  }

  ttl(key: string): Promise<number> {
    const entry = this.live(key);
    if (!entry) {
      return Promise.resolve(-2);
    }
    if (entry.expireAt === null) {
      return Promise.resolve(-1);
    }
    return Promise.resolve(Math.ceil((entry.expireAt - Date.now()) / 1000));
  }

  del(key: string): Promise<number> {
    return Promise.resolve(this.store.delete(key) ? 1 : 0);
  }

  ping(): Promise<'PONG'> {
    return Promise.resolve('PONG');
  }

  quit(): Promise<'OK'> {
    return Promise.resolve('OK');
  }

  connect(): Promise<void> {
    return Promise.resolve();
  }

  readonly status = 'ready';
}

const LOGIN_URL = '/api/v1/auth/login';

// These e2e specs build the app via createNestApplication() without the global
// AllExceptionsFilter that main.ts bootstrap() installs, so a thrown
// HttpException's payload is the body directly (`{ code }`); the filter would
// instead wrap it as `{ error: { code } }`. Tolerate both shapes.
const errorCode = (body: unknown): string => {
  const b = body as { code?: string; error?: { code?: string } };
  return b.error?.code ?? b.code ?? '';
};

describe('Login rate limiting (e2e, R1-05)', () => {
  let app: INestApplication<App>;

  const attemptLogin = (email: string) =>
    request(app.getHttpServer())
      .post(LOGIN_URL)
      .send({ email, password: 'wrong-password' });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(REDIS_CLIENT)
      .useValue(new FakeRedis())
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      })
      .overrideProvider(UserRepository)
      .useValue({
        findByEmail: jest.fn().mockResolvedValue(null),
        findById: jest.fn().mockResolvedValue(null),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 for the first four failed attempts, then 429 once locked', async () => {
    const email = 'attacker@wedecor.test';

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await attemptLogin(email);
      expect(response.status).toBe(401);
      expect(errorCode(response.body)).toBe('INVALID_CREDENTIALS');
    }

    // The 5th failure trips the lockout; that response is already locked (429).
    const fifth = await attemptLogin(email);
    expect(fifth.status).toBe(429);
    expect(errorCode(fifth.body)).toBe('RATE_LIMITED');

    // Subsequent attempts remain locked.
    const sixth = await attemptLogin(email);
    expect(sixth.status).toBe(429);
  });

  it('isolates the lockout per email (a different email is unaffected)', async () => {
    const other = 'someone-else@wedecor.test';

    const response = await attemptLogin(other);

    expect(response.status).toBe(401);
    expect(errorCode(response.body)).toBe('INVALID_CREDENTIALS');
  });

  it('does not rate limit other endpoints (auth guard still governs them)', async () => {
    // A protected endpoint returns 401 (missing token) — never 429.
    await request(app.getHttpServer()).get('/api/v1/leads').expect(401);
    // The public health probe is unaffected by login lockouts.
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});
