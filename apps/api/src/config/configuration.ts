import type { EnvConfig } from './env.schema';

export default (): EnvConfig & { redisUrl: string } => {
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisHost = process.env.REDIS_HOST ?? 'localhost';
  const redisPort = process.env.REDIS_PORT ?? '6379';
  const redisAuth = redisPassword ? `:${redisPassword}@` : '';

  // R1-04 — `validate: validateEnv` (env.schema.ts) already runs before this
  // factory during ConfigModule.forRoot() and fails bootstrap first if
  // JWT_SECRET is missing/short, so this branch is unreachable in normal
  // bootstrap. It stays here so `configuration()` never silently narrows
  // `process.env.JWT_SECRET` (string | undefined) to `EnvConfig['JWT_SECRET']`
  // (string) without a check, and so this factory is safe to call directly
  // (e.g. in tests) without relying on that ordering.
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET is not configured. Set it before starting the application.',
    );
  }

  return {
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) ?? 'development',
    PORT: Number(process.env.PORT ?? 3000),
    LOG_LEVEL: (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) ?? 'info',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    REDIS_HOST: redisHost,
    REDIS_PORT: Number(redisPort),
    REDIS_PASSWORD: redisPassword,
    JWT_SECRET: jwtSecret,
    SENTRY_DSN: process.env.SENTRY_DSN?.trim()
      ? process.env.SENTRY_DSN.trim()
      : undefined,
    redisUrl: `redis://${redisAuth}${redisHost}:${redisPort}`,
  };
};
