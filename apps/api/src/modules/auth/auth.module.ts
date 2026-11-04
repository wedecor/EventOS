import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { EnvConfig } from '../../config';
import { PrismaModule } from '../../database/prisma.module';
import { BreachedPasswordChecker } from './application/ports/breached-password.checker';
import { AuthApplicationService } from './application/services/auth.application.service';
import { LoginThrottleService } from './application/services/login-throttle.service';
import { PasswordChangeService } from './application/services/password-change.service';
import { PasswordPolicyService } from './application/services/password-policy.service';
import { PasswordService } from './application/services/password.service';
import { PermissionService } from './application/services/permission.service';
import { TokenService } from './application/services/token.service';
import { LoginAttemptRepository } from './domain/repositories/login-attempt.repository';
import { PasswordHistoryRepository } from './domain/repositories/password-history.repository';
import { SessionRepository } from './domain/repositories/session.repository';
import { UserRepository } from './domain/repositories/user.repository';
import { HibpBreachedPasswordChecker } from './infrastructure/hibp.breached-password.checker';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { LoginAttemptRepositoryImpl } from './infrastructure/persistence/login-attempt.repository.impl';
import { PasswordHistoryRepositoryImpl } from './infrastructure/persistence/password-history.repository.impl';
import { SessionRepositoryImpl } from './infrastructure/persistence/session.repository.impl';
import { UserRepositoryImpl } from './infrastructure/persistence/user.repository.impl';
import { AuthController } from './presentation/auth.controller';

/**
 * Auth Module (docs/10 §Auth Module) — ADR-008 email/password login with JWT
 * access tokens + rotating refresh tokens. Self-contained: it provides its own
 * repositories, so it does not depend on RepositoriesModule/ApplicationServicesModule.
 */
@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvConfig, true>) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: { algorithm: 'HS256' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: SessionRepository, useClass: SessionRepositoryImpl },
    // R1-05 — Redis-backed login brute-force state (reuses the global REDIS_CLIENT).
    { provide: LoginAttemptRepository, useClass: LoginAttemptRepositoryImpl },
    // R1-10 — password history persistence + HIBP breach lookup adapter.
    {
      provide: PasswordHistoryRepository,
      useClass: PasswordHistoryRepositoryImpl,
    },
    { provide: BreachedPasswordChecker, useClass: HibpBreachedPasswordChecker },
    PasswordService,
    TokenService,
    LoginThrottleService,
    PasswordPolicyService,
    PasswordChangeService,
    AuthApplicationService,
    PermissionService,
    JwtStrategy,
  ],
  // PermissionService is exported so the globally-registered PermissionsGuard
  // (APP_GUARD in AppModule) can resolve it for C4 authorization enforcement.
  exports: [AuthApplicationService, PermissionService],
})
export class AuthModule {}
