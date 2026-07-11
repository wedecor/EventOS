import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { QuotationController } from './presentation/quotation.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [QuotationController],
})
export class QuotationModule {}
