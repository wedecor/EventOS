import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { TenantSettingsController } from './presentation/tenant-settings.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [TenantSettingsController],
})
export class TenantModule {}
