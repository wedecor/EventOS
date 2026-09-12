import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { EventRepository } from './booking/domain/repositories/event.repository';
import { EventRepositoryImpl } from './booking/infrastructure/persistence/event.repository.impl';
import { CustomerRepository } from './customer/domain/repositories/customer.repository';
import { CustomerRepositoryImpl } from './customer/infrastructure/persistence/customer.repository.impl';
import { InvoiceLineItemRepository } from './finance/domain/repositories/invoice-line-item.repository';
import { InvoiceLineItemRepositoryImpl } from './finance/infrastructure/persistence/invoice-line-item.repository.impl';
import { InvoiceRepository } from './finance/domain/repositories/invoice.repository';
import { InvoiceRepositoryImpl } from './finance/infrastructure/persistence/invoice.repository.impl';
import { VendorExpenseRepository } from './finance/domain/repositories/vendor-expense.repository';
import { VendorExpenseRepositoryImpl } from './finance/infrastructure/persistence/vendor-expense.repository.impl';
import { InventoryMovementDamageNoteRepository } from './inventory/domain/repositories/inventory-movement-damage-note.repository';
import { InventoryMovementRepository } from './inventory/domain/repositories/inventory-movement.repository';
import { InventoryMovementDamageNoteRepositoryImpl } from './inventory/infrastructure/persistence/inventory-movement-damage-note.repository.impl';
import { InventoryMovementRepositoryImpl } from './inventory/infrastructure/persistence/inventory-movement.repository.impl';
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
import { ProcurementLineIssueNoteRepository } from './vendor/domain/repositories/procurement-line-issue-note.repository';
import { ProcurementLineIssueNoteRepositoryImpl } from './vendor/infrastructure/persistence/procurement-line-issue-note.repository.impl';
import { ProcurementLineRepository } from './vendor/domain/repositories/procurement-line.repository';
import { ProcurementLineRepositoryImpl } from './vendor/infrastructure/persistence/procurement-line.repository.impl';
import { VendorIssueNoteRepository } from './vendor/domain/repositories/vendor-issue-note.repository';
import { VendorIssueNoteRepositoryImpl } from './vendor/infrastructure/persistence/vendor-issue-note.repository.impl';
import { VendorProcurementRepository } from './vendor/domain/repositories/vendor-procurement.repository';
import { VendorProcurementRepositoryImpl } from './vendor/infrastructure/persistence/vendor-procurement.repository.impl';
import { VendorRepository } from './vendor/domain/repositories/vendor.repository';
import { VendorRepositoryImpl } from './vendor/infrastructure/persistence/vendor.repository.impl';

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
    {
      provide: InventoryMovementRepository,
      useClass: InventoryMovementRepositoryImpl,
    },
    {
      provide: InventoryMovementDamageNoteRepository,
      useClass: InventoryMovementDamageNoteRepositoryImpl,
    },
    { provide: VendorRepository, useClass: VendorRepositoryImpl },
    {
      provide: VendorIssueNoteRepository,
      useClass: VendorIssueNoteRepositoryImpl,
    },
    {
      provide: VendorProcurementRepository,
      useClass: VendorProcurementRepositoryImpl,
    },
    {
      provide: ProcurementLineRepository,
      useClass: ProcurementLineRepositoryImpl,
    },
    {
      provide: ProcurementLineIssueNoteRepository,
      useClass: ProcurementLineIssueNoteRepositoryImpl,
    },
    { provide: InvoiceRepository, useClass: InvoiceRepositoryImpl },
    {
      provide: InvoiceLineItemRepository,
      useClass: InvoiceLineItemRepositoryImpl,
    },
    {
      provide: VendorExpenseRepository,
      useClass: VendorExpenseRepositoryImpl,
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
    InventoryMovementRepository,
    InventoryMovementDamageNoteRepository,
    VendorRepository,
    VendorIssueNoteRepository,
    VendorProcurementRepository,
    ProcurementLineRepository,
    ProcurementLineIssueNoteRepository,
    InvoiceRepository,
    InvoiceLineItemRepository,
    VendorExpenseRepository,
  ],
})
export class RepositoriesModule {}
