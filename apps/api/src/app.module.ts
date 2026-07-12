import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth';
import { HealthModule } from './common';
import { configuration, validateEnv } from './config';
import { DatabaseModule, PrismaModule } from './database';
import { ApplicationServicesModule } from './modules/application-services.module';
import { BookingModule } from './modules/booking/booking.module';
import { CustomerModule } from './modules/customer/customer.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { LeadModule } from './modules/lead/lead.module';
import { PaymentModule } from './modules/payment/payment.module';
import { QuotationModule } from './modules/quotation/quotation.module';
import { RepositoriesModule } from './modules/repositories.module';
import { StaffModule } from './modules/staff/staff.module';
import { TaskModule } from './modules/task/task.module';
import { VendorModule } from './modules/vendor/vendor.module';

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
    LeadModule,
    CustomerModule,
    QuotationModule,
    BookingModule,
    PaymentModule,
    TaskModule,
    StaffModule,
    InventoryModule,
    VendorModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
