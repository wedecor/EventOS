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

  const smtpSecureRaw = process.env.SMTP_SECURE;
  const smtpSecure =
    smtpSecureRaw === 'true'
      ? true
      : smtpSecureRaw === 'false'
        ? false
        : undefined;

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
    STORAGE_PROVIDER:
      (process.env.STORAGE_PROVIDER as EnvConfig['STORAGE_PROVIDER']) ?? 'local',
    STORAGE_LOCAL_ROOT: process.env.STORAGE_LOCAL_ROOT,
    STORAGE_ENDPOINT: process.env.STORAGE_ENDPOINT,
    STORAGE_ACCESS_KEY: process.env.STORAGE_ACCESS_KEY,
    STORAGE_SECRET_KEY: process.env.STORAGE_SECRET_KEY,
    STORAGE_BUCKET: process.env.STORAGE_BUCKET,
    STORAGE_REGION: process.env.STORAGE_REGION,
    STORAGE_MAX_UPLOAD_BYTES: process.env.STORAGE_MAX_UPLOAD_BYTES
      ? Number(process.env.STORAGE_MAX_UPLOAD_BYTES)
      : undefined,
    MAIL_PROVIDER:
      (process.env.MAIL_PROVIDER as EnvConfig['MAIL_PROVIDER']) ?? 'test',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
    MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL ?? '',
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT
      ? Number(process.env.SMTP_PORT)
      : undefined,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_SECURE: smtpSecure,
    MAIL_WEBHOOK_SECRET: process.env.MAIL_WEBHOOK_SECRET,
    MAIL_IDEMPOTENCY_WINDOW_SEC: process.env.MAIL_IDEMPOTENCY_WINDOW_SEC
      ? Number(process.env.MAIL_IDEMPOTENCY_WINDOW_SEC)
      : undefined,
    redisUrl: `redis://${redisAuth}${redisHost}:${redisPort}`,
  };
};
