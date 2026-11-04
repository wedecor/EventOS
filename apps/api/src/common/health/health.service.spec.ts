import type Redis from 'ioredis';
import type { PrismaService } from '../../database/prisma.service';
import { HealthService } from './health.service';

/**
 * R1-11 — minimum coverage for the shared health probe so the docs/15 overall
 * line coverageThreshold (global remainder after layered path thresholds) clears 75%.
 */
describe('HealthService', () => {
  let prisma: { $queryRaw: jest.Mock };
  let redis: { ping: jest.Mock };
  let service: HealthService;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) };
    redis = { ping: jest.fn().mockResolvedValue('PONG') };
    service = new HealthService(
      prisma as unknown as PrismaService,
      redis as unknown as Redis,
    );
  });

  it('reports liveness as ok', () => {
    expect(service.liveness()).toEqual({ status: 'ok' });
  });

  it('reports readiness ok when postgres and redis are up', async () => {
    await expect(service.readiness()).resolves.toEqual({
      status: 'ok',
      checks: {
        postgres: { status: 'up', latencyMs: expect.any(Number) },
        redis: { status: 'up', latencyMs: expect.any(Number) },
      },
    });
  });

  it('reports readiness degraded when postgres is down', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('db down'));

    const result = await service.readiness();

    expect(result.status).toBe('degraded');
    expect(result.checks.postgres.status).toBe('down');
    expect(result.checks.redis.status).toBe('up');
  });

  it('reports readiness degraded when redis is down', async () => {
    redis.ping.mockRejectedValue(new Error('redis down'));

    const result = await service.readiness();

    expect(result.status).toBe('degraded');
    expect(result.checks.redis.status).toBe('down');
  });

  it('treats a non-PONG redis reply as down', async () => {
    redis.ping.mockResolvedValue('NOPE');

    const result = await service.readiness();

    expect(result.checks.redis.status).toBe('down');
  });
});
