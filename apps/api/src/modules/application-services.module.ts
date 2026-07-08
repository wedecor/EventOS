import { Module } from '@nestjs/common';
import { AdvancePaymentQuery } from '../shared/application/ports/advance-payment.query';
import { NoAdvancePaymentQuery } from '../shared/application/ports/advance-payment.query.impl';
import { DomainEventPublisher } from '../shared/events/domain-event.base';
import { NestDomainEventPublisher } from '../shared/events/domain-event.publisher';
import { BookingApplicationService } from './booking/application/services/booking.application.service';
import { CustomerApplicationService } from './customer/application/services/customer.application.service';
import { LeadApplicationService } from './lead/application/services/lead.application.service';
import { QuotationApplicationService } from './quotation/application/services/quotation.application.service';
import { RepositoriesModule } from './repositories.module';

@Module({
  imports: [RepositoriesModule],
  providers: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    BookingApplicationService,
    { provide: DomainEventPublisher, useClass: NestDomainEventPublisher },
    { provide: AdvancePaymentQuery, useClass: NoAdvancePaymentQuery },
  ],
  exports: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    BookingApplicationService,
  ],
})
export class ApplicationServicesModule {}
