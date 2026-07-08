import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth';
import { HealthModule } from './common';
import { configuration, validateEnv } from './config';
import { DatabaseModule, PrismaModule } from './database';
import { ApplicationServicesModule } from './modules/application-services.module';
import { RepositoriesModule } from './modules/repositories.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: {
          ignore: (req) => req.url?.startsWith('/health') ?? false,
        },
        customProps: () => ({ service: 'event-os-api' }),
      },
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    DatabaseModule,
    PrismaModule,
    RepositoriesModule,
    ApplicationServicesModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
