import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { EventRepository } from './booking/domain/repositories/event.repository';
import { EventRepositoryImpl } from './booking/infrastructure/persistence/event.repository.impl';
import { CustomerRepository } from './customer/domain/repositories/customer.repository';
import { CustomerRepositoryImpl } from './customer/infrastructure/persistence/customer.repository.impl';
import { FollowUpRepository } from './lead/domain/repositories/follow-up.repository';
import { FollowUpRepositoryImpl } from './lead/infrastructure/persistence/follow-up.repository.impl';
import { LeadRepository } from './lead/domain/repositories/lead.repository';
import { LeadRepositoryImpl } from './lead/infrastructure/persistence/lead.repository.impl';
import { QuotationRepository } from './quotation/domain/repositories/quotation.repository';
import { QuotationRepositoryImpl } from './quotation/infrastructure/persistence/quotation.repository.impl';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: LeadRepository, useClass: LeadRepositoryImpl },
    { provide: FollowUpRepository, useClass: FollowUpRepositoryImpl },
    { provide: CustomerRepository, useClass: CustomerRepositoryImpl },
    { provide: QuotationRepository, useClass: QuotationRepositoryImpl },
    { provide: EventRepository, useClass: EventRepositoryImpl },
  ],
  exports: [
    LeadRepository,
    FollowUpRepository,
    CustomerRepository,
    QuotationRepository,
    EventRepository,
  ],
})
export class RepositoriesModule {}
