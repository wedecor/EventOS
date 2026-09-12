import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { BookingsController } from './bookings.controller';
import { ClientsController } from './clients.controller';
import { FollowUpsController } from './follow-ups.controller';
import { LeadsController } from './leads.controller';
import { PaymentsController } from './payments.controller';
import { QuotationsController } from './quotations.controller';
import { SuggestionsController } from './suggestions.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    LeadsController,
    ClientsController,
    QuotationsController,
    BookingsController,
    PaymentsController,
    SuggestionsController,
    FollowUpsController,
  ],
})
export class Sprint1ApiModule {}
