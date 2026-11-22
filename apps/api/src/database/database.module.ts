import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { EnvConfig } from '../config';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Infrastructure wiring for Redis.
 * PostgreSQL is managed by PrismaModule (PrismaService).
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => {
        const options = { maxRetriesPerRequest: null, lazyConnect: true };
        // M5-01 — REDIS_URL (Memorystore / rediss://) wins over HOST/PORT/PASSWORD.
        const url = configService.get('REDIS_URL', { infer: true });
        if (url) {
          return new Redis(url, options);
        }

        const password = configService.get('REDIS_PASSWORD', { infer: true });
        const host = configService.get('REDIS_HOST', { infer: true });
        const port = configService.get('REDIS_PORT', { infer: true });

        return new Redis({
          host,
          port,
          password: password || undefined,
          ...options,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    if (this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }
}
