import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SentryModule } from '@sentry/nestjs/setup';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './common';
import { configuration, validateEnv } from './config';
import {
  LOG_REDACT_CONFIG,
  buildPinoHttpOptions,
} from './config/logging.config';
import { DatabaseModule, PrismaModule } from './database';
import { AdminModule } from './modules/admin/admin.module';
import { ApplicationServicesModule } from './modules/application-services.module';
import { BookingModule } from './modules/booking/booking.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AuthModule, JwtAuthGuard, PermissionsGuard } from './modules/auth';
import { LeadModule } from './modules/lead/lead.module';
import { PaymentModule } from './modules/payment/payment.module';
import { QuotationModule } from './modules/quotation/quotation.module';
import { RepositoriesModule } from './modules/repositories.module';
import { StaffModule } from './modules/staff/staff.module';
import { TaskModule } from './modules/task/task.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { VendorModule } from './modules/vendor/vendor.module';

/** Re-exported for R1-03 redact tests that import from `app.module`. */
export { LOG_REDACT_CONFIG };

@Module({
  imports: [
    // R2-06 — NestJS Sentry root module (no-op when instrument.ts disabled Sentry).
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
    // R2-07 — structured JSON on staging/production stdout; requestId correlation.
    LoggerModule.forRoot({
      pinoHttp: buildPinoHttpOptions(),
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
    LeadModule,
    CustomerModule,
    QuotationModule,
    BookingModule,
    ChecklistModule,
    PaymentModule,
    TaskModule,
    StaffModule,
    InventoryModule,
    VendorModule,
    FinanceModule,
    CommunicationModule,
    CalendarModule,
    AnalyticsModule,
    DashboardModule,
    AuthModule,
    AdminModule,
    TenantModule,
    HealthModule,
  ],
  providers: [
    // ADR-008 — API defaults to authenticated: every route requires a valid access
    // token unless explicitly marked @Public() (login, refresh, health probes).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // C4 (docs/14 §Authorization) — endpoint-level role/permission enforcement.
    // Registered AFTER JwtAuthGuard so the authenticated identity is present; guards
    // run in registration order.
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
