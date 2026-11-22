import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { EnquiriesFeedController } from './presentation/enquiries-feed.controller';
import { EnquiriesSignatureGuard } from './presentation/guards/enquiries-signature.guard';
import { IntegrationSettingsController } from './presentation/integration-settings.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [IntegrationSettingsController, EnquiriesFeedController],
  providers: [EnquiriesSignatureGuard],
})
export class IntegrationsModule {}
