import { ConfigModule } from '@nestjs/config';
import { configuration } from './index';
import { validateEnv } from './env.schema';

/**
 * R1-04 — exercises the exact `ConfigModule.forRoot({ load, validate })`
 * wiring used in `app.module.ts` (same factory functions, not a
 * reimplementation) to prove the application actually fails to bootstrap
 * when `JWT_SECRET` is invalid, and boots successfully when it is valid,
 * consistently regardless of `NODE_ENV`.
 */
describe('ConfigModule bootstrap — JWT_SECRET (R1-04)', () => {
  const originalEnv = { ...process.env };
  const validSecret = 'a'.repeat(32);

  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://eventos:eventos@localhost:5432/eventos';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const forRoot = () =>
    ConfigModule.forRoot({
      load: [configuration],
      validate: validateEnv,
      ignoreEnvFile: true,
    });

  it('boots successfully when JWT_SECRET is valid', async () => {
    process.env.JWT_SECRET = validSecret;

    await expect(forRoot()).resolves.toBeDefined();
  });

  it('fails bootstrap when JWT_SECRET is missing', async () => {
    delete process.env.JWT_SECRET;

    await expect(forRoot()).rejects.toThrow(/JWT_SECRET/);
  });

  it('fails bootstrap when JWT_SECRET is empty', async () => {
    process.env.JWT_SECRET = '';

    await expect(forRoot()).rejects.toThrow(/JWT_SECRET/);
  });

  it('fails bootstrap when JWT_SECRET is below the required length', async () => {
    process.env.JWT_SECRET = 'too-short-secret';

    await expect(forRoot()).rejects.toThrow(/JWT_SECRET/);
  });

  it.each(['development', 'test', 'production'])(
    'fails bootstrap consistently in NODE_ENV=%s when JWT_SECRET is missing',
    async (nodeEnv) => {
      process.env.NODE_ENV = nodeEnv;
      delete process.env.JWT_SECRET;

      await expect(forRoot()).rejects.toThrow(/JWT_SECRET/);
    },
  );

  it.each(['development', 'test', 'production'])(
    'boots successfully in NODE_ENV=%s when JWT_SECRET is valid',
    async (nodeEnv) => {
      process.env.NODE_ENV = nodeEnv;
      process.env.JWT_SECRET = validSecret;
      // R1-06 — production requires an explicit CORS_ORIGIN; irrelevant to
      // this JWT_SECRET-focused assertion, so it's supplied unconditionally.
      process.env.CORS_ORIGIN = 'https://app.wedecor.com';

      await expect(forRoot()).resolves.toBeDefined();
    },
  );
});

/**
 * R1-06 — same real `ConfigModule.forRoot({ load, validate })` wiring as
 * above, proving CORS_ORIGIN's environment-conditional rule actually gates
 * application bootstrap (not just `validateEnv` in isolation).
 */
describe('ConfigModule bootstrap — CORS_ORIGIN (R1-06)', () => {
  const originalEnv = { ...process.env };
  const validSecret = 'a'.repeat(32);

  beforeEach(() => {
    process.env.DATABASE_URL =
      'postgresql://eventos:eventos@localhost:5432/eventos';
    process.env.JWT_SECRET = validSecret;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  const forRoot = () =>
    ConfigModule.forRoot({
      load: [configuration],
      validate: validateEnv,
      ignoreEnvFile: true,
    });

  it('boots successfully in development with a localhost origin', async () => {
    process.env.NODE_ENV = 'development';
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    await expect(forRoot()).resolves.toBeDefined();
  });

  it('boots successfully in development without CORS_ORIGIN set', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.CORS_ORIGIN;

    await expect(forRoot()).resolves.toBeDefined();
  });

  it('boots successfully in production with a valid explicit origin', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = 'https://app.wedecor.com';

    await expect(forRoot()).resolves.toBeDefined();
  });

  it('fails bootstrap in production when CORS_ORIGIN is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.CORS_ORIGIN;

    await expect(forRoot()).rejects.toThrow(/CORS_ORIGIN/);
  });

  it('fails bootstrap in production when CORS_ORIGIN is "*"', async () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ORIGIN = '*';

    await expect(forRoot()).rejects.toThrow(/CORS_ORIGIN/);
  });

  it('boots successfully in staging with a valid explicit origin', async () => {
    process.env.NODE_ENV = 'staging';
    process.env.CORS_ORIGIN = 'https://staging.wedecor.com';

    await expect(forRoot()).resolves.toBeDefined();
  });

  it('fails bootstrap in staging when CORS_ORIGIN is "*"', async () => {
    process.env.NODE_ENV = 'staging';
    process.env.CORS_ORIGIN = '*';

    await expect(forRoot()).rejects.toThrow(/CORS_ORIGIN/);
  });
});
