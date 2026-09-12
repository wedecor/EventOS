import { Module } from '@nestjs/common';
import { AdvancePaymentQuery } from '../shared/application/ports/advance-payment.query';
import { PrismaAdvancePaymentQuery } from '../shared/application/ports/advance-payment.query.impl';
import { LeadConversionQuery } from '../shared/application/ports/lead-conversion.query';
import { PrismaLeadConversionQuery } from '../shared/application/ports/lead-conversion.query.impl';
import { DomainEventPublisher } from '../shared/events/domain-event.base';
import { NestDomainEventPublisher } from '../shared/events/domain-event.publisher';
import { BookingApplicationService } from './booking/application/services/booking.application.service';
import { CustomerApplicationService } from './customer/application/services/customer.application.service';
import { LeadApplicationService } from './lead/application/services/lead.application.service';
import { PaymentApplicationService } from './payment/application/services/payment.application.service';
import { QuotationApplicationService } from './quotation/application/services/quotation.application.service';
import { BookingStatusChangedSuggestionHandler } from './suggestion/application/handlers/booking-status-changed-suggestion.handler';
import { EventCreatedSuggestionHandler } from './suggestion/application/handlers/event-created-suggestion.handler';
import { SuggestionApplicationService } from './suggestion/application/services/suggestion.application.service';
import { RepositoriesModule } from './repositories.module';

@Module({
  imports: [RepositoriesModule],
  providers: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    BookingApplicationService,
    PaymentApplicationService,
    SuggestionApplicationService,
    EventCreatedSuggestionHandler,
    BookingStatusChangedSuggestionHandler,
    { provide: DomainEventPublisher, useClass: NestDomainEventPublisher },
    { provide: AdvancePaymentQuery, useClass: PrismaAdvancePaymentQuery },
    { provide: LeadConversionQuery, useClass: PrismaLeadConversionQuery },
  ],
  exports: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    BookingApplicationService,
    PaymentApplicationService,
    SuggestionApplicationService,
    RepositoriesModule,
  ],
})
export class ApplicationServicesModule {}
