import type { EnvConfig } from './env.schema';

export default (): EnvConfig & { redisUrl: string } => {
  const redisPassword = process.env.REDIS_PASSWORD;
  const redisHost = process.env.REDIS_HOST ?? 'localhost';
  const redisPort = process.env.REDIS_PORT ?? '6379';
  const redisAuth = redisPassword ? `:${redisPassword}@` : '';

  return {
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) ?? 'development',
    PORT: Number(process.env.PORT ?? 3000),
    LOG_LEVEL: (process.env.LOG_LEVEL as EnvConfig['LOG_LEVEL']) ?? 'info',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
    DATABASE_URL: process.env.DATABASE_URL ?? '',
    REDIS_HOST: redisHost,
    REDIS_PORT: Number(redisPort),
    REDIS_PASSWORD: redisPassword,
    JWT_SECRET: process.env.JWT_SECRET,
    redisUrl: `redis://${redisAuth}${redisHost}:${redisPort}`,
  };
};
