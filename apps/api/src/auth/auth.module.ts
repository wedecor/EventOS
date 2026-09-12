import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RepositoriesModule } from '../modules/repositories.module';
import type { EnvConfig } from '../config/env.schema';
import { ApiAuthGuard } from './api-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DEV_JWT_SECRET, DEFAULT_JWT_EXPIRES_IN } from './auth.constants';
import { TenantContext } from './tenant.context';
import { TenantGuard } from './tenant.guard';

@Global()
@Module({
  imports: [
    RepositoriesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvConfig, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }) ?? DEV_JWT_SECRET,
        signOptions: {
          expiresIn: (process.env.JWT_EXPIRES_IN?.trim() ||
            DEFAULT_JWT_EXPIRES_IN) as `${number}${'s' | 'm' | 'h' | 'd'}`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    TenantContext,
    TenantGuard,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: ApiAuthGuard,
    },
  ],
  exports: [TenantContext, TenantGuard, AuthService, RepositoriesModule],
})
export class AuthModule {}
