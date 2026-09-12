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
import { PaymentRepository } from './payment/domain/repositories/payment.repository';
import { PaymentRepositoryImpl } from './payment/infrastructure/persistence/payment.repository.impl';
import { TenantRepository } from './platform/domain/repositories/tenant.repository';
import { TenantRepositoryImpl } from './platform/infrastructure/persistence/tenant.repository.impl';
import { AuthSessionRepository } from './platform/domain/repositories/auth-session.repository';
import { AuthSessionRepositoryImpl } from './platform/infrastructure/persistence/auth-session.repository.impl';
import { UserRepository } from './platform/domain/repositories/user.repository';
import { UserRepositoryImpl } from './platform/infrastructure/persistence/user.repository.impl';
import { ContactRepository } from './customer/domain/repositories/contact.repository';
import { ContactRepositoryImpl } from './customer/infrastructure/persistence/contact.repository.impl';
import { QuotationLineItemRepository } from './quotation/domain/repositories/quotation-line-item.repository';
import { QuotationLineItemRepositoryImpl } from './quotation/infrastructure/persistence/quotation-line-item.repository.impl';
import { QuotationRepository } from './quotation/domain/repositories/quotation.repository';
import { QuotationRepositoryImpl } from './quotation/infrastructure/persistence/quotation.repository.impl';
import { SuggestionRepository } from './suggestion/domain/repositories/suggestion.repository';
import { SuggestionRepositoryImpl } from './suggestion/infrastructure/persistence/suggestion.repository.impl';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: TenantRepository, useClass: TenantRepositoryImpl },
    { provide: UserRepository, useClass: UserRepositoryImpl },
    { provide: AuthSessionRepository, useClass: AuthSessionRepositoryImpl },
    { provide: LeadRepository, useClass: LeadRepositoryImpl },
    { provide: FollowUpRepository, useClass: FollowUpRepositoryImpl },
    { provide: CustomerRepository, useClass: CustomerRepositoryImpl },
    { provide: ContactRepository, useClass: ContactRepositoryImpl },
    { provide: QuotationRepository, useClass: QuotationRepositoryImpl },
    {
      provide: QuotationLineItemRepository,
      useClass: QuotationLineItemRepositoryImpl,
    },
    { provide: EventRepository, useClass: EventRepositoryImpl },
    { provide: PaymentRepository, useClass: PaymentRepositoryImpl },
    { provide: SuggestionRepository, useClass: SuggestionRepositoryImpl },
  ],
  exports: [
    TenantRepository,
    UserRepository,
    AuthSessionRepository,
    LeadRepository,
    FollowUpRepository,
    CustomerRepository,
    ContactRepository,
    QuotationRepository,
    QuotationLineItemRepository,
    EventRepository,
    PaymentRepository,
    SuggestionRepository,
  ],
})
export class RepositoriesModule {}
