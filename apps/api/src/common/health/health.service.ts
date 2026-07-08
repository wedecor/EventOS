import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';
import { REDIS_CLIENT } from '../../database/redis.constants';

export type HealthCheckResult = {
  status: 'ok' | 'degraded' | 'error';
  checks: {
    postgres: { status: 'up' | 'down'; latencyMs?: number };
    redis: { status: 'up' | 'down'; latencyMs?: number };
  };
};

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async readiness(): Promise<HealthCheckResult> {
    const [postgres, redis] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
    ]);

    const checks = {
      postgres,
      redis,
    };

    const allUp = Object.values(checks).every((check) => check.status === 'up');

    return {
      status: allUp ? 'ok' : 'degraded',
      checks,
    };
  }

  private async checkPostgres(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
  }> {
    const started = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - started };
    } catch {
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
  }> {
    const started = Date.now();

    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        return { status: 'down' };
      }
      return { status: 'up', latencyMs: Date.now() - started };
    } catch {
      return { status: 'down' };
    }
  }
}
