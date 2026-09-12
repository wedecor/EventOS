import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { RepositoriesModule } from '../repositories.module';
import { FollowUpController } from './presentation/follow-up.controller';
import { LeadController } from './presentation/lead.controller';

@Module({
  imports: [ApplicationServicesModule, RepositoriesModule],
  controllers: [LeadController, FollowUpController],
})
export class LeadModule {}
