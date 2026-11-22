import configuration from './configuration';

/**
 * R1-04 — `configuration()` is the `ConfigModule` `load` factory that
 * produces the value `ConfigService.get('JWT_SECRET', ...)` actually
 * returns. It carries its own defensive guard so it stays safe even if ever
 * invoked outside the normal `validate` → `load` bootstrap order (see
 * `env.schema.spec.ts` for the primary fail-fast gate, and
 * `bootstrap.spec.ts` for the two wired together through `ConfigModule`).
 */
describe('configuration() — JWT_SECRET (R1-04)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('throws when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => configuration()).toThrow(/JWT_SECRET/);
  });

  it('throws when JWT_SECRET is an empty string', () => {
    process.env.JWT_SECRET = '';

    expect(() => configuration()).toThrow(/JWT_SECRET/);
  });

  it('returns the configured JWT_SECRET when present', () => {
    process.env.JWT_SECRET = 'a'.repeat(32);

    const config = configuration();

    expect(config.JWT_SECRET).toBe('a'.repeat(32));
  });
});

describe('configuration() — SENTRY_DSN (R2-06)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.DATABASE_URL =
      'postgresql://eventos:eventos@localhost:5432/eventos';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('omits SENTRY_DSN when unset', () => {
    delete process.env.SENTRY_DSN;

    expect(configuration().SENTRY_DSN).toBeUndefined();
  });

  it('exposes trimmed SENTRY_DSN when set', () => {
    process.env.SENTRY_DSN =
      '  https://examplePublicKey@o0.ingest.sentry.io/0  ';

    expect(configuration().SENTRY_DSN).toBe(
      'https://examplePublicKey@o0.ingest.sentry.io/0',
    );
  });
});

describe('configuration() — Enquiries feed (M5-01)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.DATABASE_URL =
      'postgresql://eventos:eventos@localhost:5432/eventos';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('exposes the feed secrets and tenant, trimming whitespace', () => {
    process.env.ENQUIRIES_FEED_SECRET = `  ${'s'.repeat(32)}  `;
    process.env.ENQUIRIES_FEED_SECRET_NEXT = 'n'.repeat(32);
    process.env.ENQUIRIES_FEED_TENANT_ID =
      '00000000-0000-0000-0000-000000000009';

    const config = configuration();

    expect(config.ENQUIRIES_FEED_SECRET).toBe('s'.repeat(32));
    expect(config.ENQUIRIES_FEED_SECRET_NEXT).toBe('n'.repeat(32));
    expect(config.ENQUIRIES_FEED_TENANT_ID).toBe(
      '00000000-0000-0000-0000-000000000009',
    );
  });

  it('leaves unset values undefined', () => {
    delete process.env.ENQUIRIES_FEED_SECRET;
    delete process.env.ENQUIRIES_FEED_SECRET_NEXT;
    delete process.env.ENQUIRIES_FEED_TENANT_ID;

    const config = configuration();

    expect(config.ENQUIRIES_FEED_SECRET).toBeUndefined();
    expect(config.ENQUIRIES_FEED_SECRET_NEXT).toBeUndefined();
    expect(config.ENQUIRIES_FEED_TENANT_ID).toBeUndefined();
  });
});

describe('configuration() — REDIS_URL (M5-01)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.JWT_SECRET = 'a'.repeat(32);
    process.env.DATABASE_URL =
      'postgresql://eventos:eventos@localhost:5432/eventos';
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    delete process.env.REDIS_PASSWORD;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('builds redisUrl from host/port/password by default', () => {
    process.env.REDIS_PASSWORD = 'pw';

    expect(configuration().redisUrl).toBe('redis://:pw@localhost:6379');
  });

  it('prefers REDIS_URL when set', () => {
    process.env.REDIS_URL = ' redis://10.0.0.3:6379 ';

    const config = configuration();

    expect(config.REDIS_URL).toBe('redis://10.0.0.3:6379');
    expect(config.redisUrl).toBe('redis://10.0.0.3:6379');
  });
});
