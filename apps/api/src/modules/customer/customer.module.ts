import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { RepositoriesModule } from '../repositories.module';
import { CustomerController } from './presentation/customer.controller';
import { ContactController } from './presentation/contact.controller';
import { CustomerIntelligenceController } from './presentation/customer-intelligence.controller';
import { IssueController } from './presentation/issue.controller';
import { ReviewRequestController } from './presentation/review-request.controller';
import { TimelineController } from './presentation/timeline.controller';

@Module({
  imports: [ApplicationServicesModule, RepositoriesModule],
  controllers: [
    CustomerController,
    ContactController,
    TimelineController,
    CustomerIntelligenceController,
    IssueController,
    ReviewRequestController,
  ],
})
export class CustomerModule {}
