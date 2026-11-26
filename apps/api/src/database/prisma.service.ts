import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { EnvConfig } from '../config';
import { buildPoolConfig } from './pool-config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<EnvConfig, true>) {
    const databaseUrl = configService.get('DATABASE_URL', { infer: true });
    const nodeEnv = configService.get('NODE_ENV', { infer: true });
    const isDevelopment = nodeEnv === 'development';

    // Cloud SQL db-f1-micro has ~25 max connections: cap the pool (see pool-config.ts).
    const adapter = new PrismaPg(buildPoolConfig(databaseUrl));

    super({
      adapter,
      log: isDevelopment
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PostgreSQL connection established');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('PostgreSQL connection closed');
  }
}
