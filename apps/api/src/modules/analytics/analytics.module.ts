import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { AnalyticsController } from './presentation/analytics.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
