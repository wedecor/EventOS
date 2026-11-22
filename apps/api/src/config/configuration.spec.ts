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
