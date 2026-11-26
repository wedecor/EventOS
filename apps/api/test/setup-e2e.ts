process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://eventos:eventos@localhost:5432/eventos?schema=public';
// Redis is optional: tests default to NO Redis (in-memory throttle/lockout).
// Specs that exercise the Redis path override REDIS_CLIENT explicitly.
delete process.env.REDIS_URL;
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-at-least-32-characters-long';
