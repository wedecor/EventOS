import { validateEnv } from './env.schema';

/**
 * R1-04 (docs/16 §Environment Variables, docs/22 §Troubleshooting) —
 * JWT_SECRET must be mandatory and at least 32 characters (256 bits) in
 * every environment. `validateEnv` is the fail-fast gate `ConfigModule`
 * invokes during bootstrap (see `configuration.spec.ts` / `bootstrap.spec.ts`
 * for the layers that consume its result).
 */
// M5-01 — staging/production additionally require the Enquiries feed secret + tenant.
const feedConfig = {
  ENQUIRIES_FEED_SECRET: 'f'.repeat(32),
  ENQUIRIES_FEED_TENANT_ID: '00000000-0000-0000-0000-000000000001',
};

describe('validateEnv — JWT_SECRET (R1-04)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
  };
  const validSecret = 'a'.repeat(32);

  it('accepts a valid 32-character JWT_SECRET', () => {
    const result = validateEnv({ ...baseConfig, JWT_SECRET: validSecret });

    expect(result.JWT_SECRET).toBe(validSecret);
  });

  it('accepts a JWT_SECRET longer than the minimum', () => {
    const longSecret = 'a'.repeat(64);

    const result = validateEnv({ ...baseConfig, JWT_SECRET: longSecret });

    expect(result.JWT_SECRET).toBe(longSecret);
  });

  it('rejects a missing JWT_SECRET (key absent)', () => {
    expect(() => validateEnv({ ...baseConfig })).toThrow(/JWT_SECRET/);
  });

  it('rejects an empty JWT_SECRET', () => {
    expect(() => validateEnv({ ...baseConfig, JWT_SECRET: '' })).toThrow(
      /JWT_SECRET/,
    );
  });

  it('rejects a JWT_SECRET below the 32-character minimum', () => {
    expect(() =>
      validateEnv({ ...baseConfig, JWT_SECRET: 'a'.repeat(31) }),
    ).toThrow(/JWT_SECRET/);
  });

  it('rejects a JWT_SECRET exactly one character below the boundary', () => {
    expect(() =>
      validateEnv({ ...baseConfig, JWT_SECRET: 'short-secret' }),
    ).toThrow(/at least 32 characters/);
  });

  it('accepts a JWT_SECRET exactly at the 32-character boundary', () => {
    expect(() =>
      validateEnv({ ...baseConfig, JWT_SECRET: 'a'.repeat(32) }),
    ).not.toThrow();
  });

  it('includes a clear, documented reason in the failure message', () => {
    expect(() =>
      validateEnv({ ...baseConfig, JWT_SECRET: 'too-short' }),
    ).toThrow(/256 bits/);
  });

  it('fails validation consistently regardless of NODE_ENV', () => {
    for (const nodeEnv of ['development', 'test', 'production']) {
      expect(() => validateEnv({ ...baseConfig, NODE_ENV: nodeEnv })).toThrow(
        /JWT_SECRET/,
      );
    }
  });

  it('succeeds consistently across every documented NODE_ENV when JWT_SECRET is valid', () => {
    for (const nodeEnv of ['development', 'test', 'production']) {
      const result = validateEnv({
        ...baseConfig,
        NODE_ENV: nodeEnv,
        JWT_SECRET: validSecret,
        // R1-06 — production requires an explicit CORS_ORIGIN; irrelevant to
        // this JWT_SECRET-focused assertion, so it's supplied unconditionally.
        CORS_ORIGIN: 'https://app.wedecor.com',
        ...feedConfig,
      });
      expect(result.JWT_SECRET).toBe(validSecret);
    }
  });
});

/**
 * R1-06 (docs/14 §CORS: "No wildcard origins in production"; docs/16
 * §Environment Variables: "CORS_ORIGINS | All | Allowed CORS origins") —
 * development keeps the permissive `*` default; staging and production must
 * set an explicit, non-wildcard CORS_ORIGIN or bootstrap fails.
 */
describe('validateEnv — AI provider (M4-AI)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('defaults to the test adapter', () => {
    const result = validateEnv({ ...baseConfig });
    expect(result.AI_PROVIDER).toBe('test');
    expect(result.AI_MODEL).toBe('gpt-4o-mini');
  });

  it('requires AI_API_KEY when AI_PROVIDER=openai', () => {
    expect(() => validateEnv({ ...baseConfig, AI_PROVIDER: 'openai' })).toThrow(
      /AI_API_KEY/,
    );
  });

  it('accepts openai with a server-side key', () => {
    const result = validateEnv({
      ...baseConfig,
      AI_PROVIDER: 'openai',
      AI_API_KEY: 'sk-test-key',
    });
    expect(result.AI_PROVIDER).toBe('openai');
    expect(result.AI_API_KEY).toBe('sk-test-key');
  });

  it('defaults AI rate-limit caps', () => {
    const result = validateEnv({ ...baseConfig });
    expect(result.AI_RATE_LIMIT_PER_USER_PER_HOUR).toBe(30);
    expect(result.AI_RATE_LIMIT_PER_TENANT_PER_HOUR).toBe(200);
    expect(result.AI_RATE_LIMIT_WINDOW_SECONDS).toBe(3600);
  });
});

describe('validateEnv — CORS_ORIGIN (R1-06)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('allows development with an explicit localhost origin', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:5173',
    });

    expect(result.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  it('allows development without CORS_ORIGIN (defaults to "*")', () => {
    const result = validateEnv({ ...baseConfig, NODE_ENV: 'development' });

    expect(result.CORS_ORIGIN).toBe('*');
  });

  it('allows development with an explicit "*"', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: 'development',
        CORS_ORIGIN: '*',
      }),
    ).not.toThrow();
  });

  it('allows production with a valid explicit origin', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://app.wedecor.com',
      ...feedConfig,
    });

    expect(result.CORS_ORIGIN).toBe('https://app.wedecor.com');
  });

  it('rejects production with a missing CORS_ORIGIN', () => {
    expect(() =>
      validateEnv({ ...baseConfig, NODE_ENV: 'production' }),
    ).toThrow(/CORS_ORIGIN/);
  });

  it('rejects production with CORS_ORIGIN set to "*"', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: 'production',
        CORS_ORIGIN: '*',
      }),
    ).toThrow(/CORS_ORIGIN must not be "\*"/);
  });

  it('rejects production with an empty CORS_ORIGIN', () => {
    expect(() =>
      validateEnv({ ...baseConfig, NODE_ENV: 'production', CORS_ORIGIN: '' }),
    ).toThrow(/CORS_ORIGIN is required/);
  });

  it('rejects production with a wildcard hidden inside a comma-separated list', () => {
    expect(() =>
      validateEnv({
        ...baseConfig,
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://app.wedecor.com,*',
      }),
    ).toThrow(/CORS_ORIGIN must not be "\*"/);
  });

  it('allows staging with a valid explicit origin', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'staging',
      CORS_ORIGIN: 'https://staging.wedecor.com',
      ...feedConfig,
    });

    expect(result.CORS_ORIGIN).toBe('https://staging.wedecor.com');
  });

  it('rejects staging with a missing CORS_ORIGIN', () => {
    expect(() => validateEnv({ ...baseConfig, NODE_ENV: 'staging' })).toThrow(
      /CORS_ORIGIN/,
    );
  });

  it('rejects staging with CORS_ORIGIN set to "*"', () => {
    expect(() =>
      validateEnv({ ...baseConfig, NODE_ENV: 'staging', CORS_ORIGIN: '*' }),
    ).toThrow(/CORS_ORIGIN must not be "\*"/);
  });
});

/**
 * R2-06 (docs/16 §Environment Variables: "SENTRY_DSN | Staging, Prod") —
 * optional; blank values normalize to undefined so local boot stays unchanged.
 */
describe('validateEnv — SENTRY_DSN (R2-06)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('succeeds when SENTRY_DSN is absent', () => {
    const result = validateEnv({ ...baseConfig });

    expect(result.SENTRY_DSN).toBeUndefined();
  });

  it('normalizes blank SENTRY_DSN to undefined', () => {
    const result = validateEnv({ ...baseConfig, SENTRY_DSN: '  ' });

    expect(result.SENTRY_DSN).toBeUndefined();
  });

  it('preserves a present SENTRY_DSN value', () => {
    const dsn = 'https://examplePublicKey@o0.ingest.sentry.io/0';
    const result = validateEnv({ ...baseConfig, SENTRY_DSN: dsn });

    expect(result.SENTRY_DSN).toBe(dsn);
  });
});

/**
 * M5-01 (ADR-019 phase 1) — Firebase login bridge configuration.
 */
describe('validateEnv — Firebase bridge (M5-01)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
    JWT_SECRET: 'a'.repeat(32),
  };

  it('defaults the project id and provider', () => {
    const result = validateEnv({ ...baseConfig });

    expect(result.FIREBASE_PROJECT_ID).toBe('wedecorenquries');
    expect(result.FIREBASE_AUTH_PROVIDER).toBe('firebase');
    expect(result.GOOGLE_APPLICATION_CREDENTIALS).toBeUndefined();
  });

  it('accepts an explicit project id and credentials path', () => {
    const result = validateEnv({
      ...baseConfig,
      FIREBASE_PROJECT_ID: 'my-project',
      GOOGLE_APPLICATION_CREDENTIALS: '/tmp/sa.json',
    });

    expect(result.FIREBASE_PROJECT_ID).toBe('my-project');
    expect(result.GOOGLE_APPLICATION_CREDENTIALS).toBe('/tmp/sa.json');
  });

  it('allows the in-memory test verifier outside deployed tiers', () => {
    const result = validateEnv({
      ...baseConfig,
      NODE_ENV: 'development',
      FIREBASE_AUTH_PROVIDER: 'test',
    });

    expect(result.FIREBASE_AUTH_PROVIDER).toBe('test');
  });

  it.each(['staging', 'production'])(
    'refuses FIREBASE_AUTH_PROVIDER=test in %s',
    (nodeEnv) => {
      expect(() =>
        validateEnv({
          ...baseConfig,
          NODE_ENV: nodeEnv,
          CORS_ORIGIN: 'https://app.example.com',
          FIREBASE_AUTH_PROVIDER: 'test',
        }),
      ).toThrow(/FIREBASE_AUTH_PROVIDER/);
    },
  );
});

/**
 * M5-01 — Enquiries → EventOS booking feed configuration. The HMAC secret and the
 * tenant are required wherever the feed is exposed (staging/production); local
 * development and tests run without them (the endpoint then rejects every request).
 */
describe('validateEnv — Enquiries feed (M5-01)', () => {
  const baseConfig = {
    DATABASE_URL: 'postgresql://eventos:eventos@localhost:5432/eventos',
    JWT_SECRET: 'a'.repeat(32),
    CORS_ORIGIN: 'https://app.wedecor.com',
  };

  it('does not require feed settings in development or test', () => {
    for (const nodeEnv of ['development', 'test']) {
      const result = validateEnv({ ...baseConfig, NODE_ENV: nodeEnv });
      expect(result.ENQUIRIES_FEED_SECRET).toBeUndefined();
      expect(result.ENQUIRIES_FEED_TENANT_ID).toBeUndefined();
    }
  });

  it.each(['staging', 'production'])(
    'requires ENQUIRIES_FEED_SECRET and ENQUIRIES_FEED_TENANT_ID in %s',
    (nodeEnv) => {
      expect(() => validateEnv({ ...baseConfig, NODE_ENV: nodeEnv })).toThrow(
        /ENQUIRIES_FEED_SECRET.*required/s,
      );
      expect(() =>
        validateEnv({
          ...baseConfig,
          NODE_ENV: nodeEnv,
          ENQUIRIES_FEED_SECRET: feedConfig.ENQUIRIES_FEED_SECRET,
        }),
      ).toThrow(/ENQUIRIES_FEED_TENANT_ID.*required/s);
      expect(() =>
        validateEnv({
          ...baseConfig,
          NODE_ENV: nodeEnv,
          ENQUIRIES_FEED_TENANT_ID: feedConfig.ENQUIRIES_FEED_TENANT_ID,
        }),
      ).toThrow(/ENQUIRIES_FEED_SECRET.*required/s);
    },
  );

  it('rejects short secrets and a non-UUID tenant', () => {
    expect(() =>
      validateEnv({ ...baseConfig, ENQUIRIES_FEED_SECRET: 'short' }),
    ).toThrow(/at least 32 characters/);
    expect(() =>
      validateEnv({ ...baseConfig, ENQUIRIES_FEED_SECRET_NEXT: 'short' }),
    ).toThrow(/at least 32 characters/);
    expect(() =>
      validateEnv({ ...baseConfig, ENQUIRIES_FEED_TENANT_ID: 'not-a-uuid' }),
    ).toThrow(/must be a UUID/);
  });

  it('treats blank values as unset and accepts the rotation secret', () => {
    const blank = validateEnv({
      ...baseConfig,
      ENQUIRIES_FEED_SECRET: '   ',
      ENQUIRIES_FEED_SECRET_NEXT: '',
    });
    expect(blank.ENQUIRIES_FEED_SECRET).toBeUndefined();
    expect(blank.ENQUIRIES_FEED_SECRET_NEXT).toBeUndefined();

    const rotating = validateEnv({
      ...baseConfig,
      NODE_ENV: 'production',
      ...feedConfig,
      ENQUIRIES_FEED_SECRET_NEXT: 'n'.repeat(40),
    });
    expect(rotating.ENQUIRIES_FEED_SECRET_NEXT).toBe('n'.repeat(40));
  });
});
