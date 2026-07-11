import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { PaymentController } from './presentation/payment.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [PaymentController],
})
export class PaymentModule {}
