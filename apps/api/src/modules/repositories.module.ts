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
import { QuotationLineItemRepository } from './quotation/domain/repositories/quotation-line-item.repository';
import { QuotationLineItemRepositoryImpl } from './quotation/infrastructure/persistence/quotation-line-item.repository.impl';
import { QuotationRepository } from './quotation/domain/repositories/quotation.repository';
import { QuotationRepositoryImpl } from './quotation/infrastructure/persistence/quotation.repository.impl';
import { StaffAssignmentRepository } from './staff/domain/repositories/staff-assignment.repository';
import { StaffAssignmentRepositoryImpl } from './staff/infrastructure/persistence/staff-assignment.repository.impl';
import { ChecklistItemRepository } from './task/domain/repositories/checklist-item.repository';
import { ChecklistItemRepositoryImpl } from './task/infrastructure/persistence/checklist-item.repository.impl';
import { TaskRepository } from './task/domain/repositories/task.repository';
import { TaskRepositoryImpl } from './task/infrastructure/persistence/task.repository.impl';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: LeadRepository, useClass: LeadRepositoryImpl },
    { provide: FollowUpRepository, useClass: FollowUpRepositoryImpl },
    { provide: CustomerRepository, useClass: CustomerRepositoryImpl },
    { provide: QuotationRepository, useClass: QuotationRepositoryImpl },
    {
      provide: QuotationLineItemRepository,
      useClass: QuotationLineItemRepositoryImpl,
    },
    { provide: EventRepository, useClass: EventRepositoryImpl },
    { provide: PaymentRepository, useClass: PaymentRepositoryImpl },
    { provide: TaskRepository, useClass: TaskRepositoryImpl },
    {
      provide: ChecklistItemRepository,
      useClass: ChecklistItemRepositoryImpl,
    },
    {
      provide: StaffAssignmentRepository,
      useClass: StaffAssignmentRepositoryImpl,
    },
  ],
  exports: [
    LeadRepository,
    FollowUpRepository,
    CustomerRepository,
    QuotationRepository,
    QuotationLineItemRepository,
    EventRepository,
    PaymentRepository,
    TaskRepository,
    ChecklistItemRepository,
    StaffAssignmentRepository,
  ],
})
export class RepositoriesModule {}
