import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { IntegrationSettingsController } from './presentation/integration-settings.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [IntegrationSettingsController],
})
export class IntegrationsModule {}
