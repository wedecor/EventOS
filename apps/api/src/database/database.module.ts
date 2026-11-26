import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { EnvConfig } from '../config';
import { REDIS_CLIENT } from './redis.constants';

/**
 * Infrastructure wiring for Redis (optional).
 * PostgreSQL is managed by PrismaModule (PrismaService).
 *
 * `REDIS_CLIENT` is `null` unless `REDIS_URL` is set. Consumers must fall back
 * to in-memory / Postgres state. Cloud Run YAMLs do not set REDIS_URL.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
      ): Redis | null => {
        // REDIS_URL is the only enable switch; unset → Redis disabled.
        const url = configService.get('REDIS_URL', { infer: true });
        if (!url) {
          return null;
        }
        const password = configService.get('REDIS_PASSWORD', { infer: true });
        return new Redis(url, {
          maxRetriesPerRequest: null,
          lazyConnect: true,
          ...(password ? { password } : {}),
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class DatabaseModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis | null) {}

  onModuleInit(): void {
    if (!this.redis) {
      this.logger.warn(
        'REDIS_URL is not set: rate limiting, login lockout and AI limits are in-memory. ' +
          'This requires Cloud Run maxScale=1; state is lost on cold start and restart.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis && this.redis.status !== 'end') {
      await this.redis.quit();
    }
  }
}
