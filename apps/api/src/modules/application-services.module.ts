import { Module } from '@nestjs/common';
import { AdvancePaymentQuery } from '../shared/application/ports/advance-payment.query';
import { PrismaAdvancePaymentQuery } from '../shared/application/ports/advance-payment.query.impl';
import { DomainEventPublisher } from '../shared/events/domain-event.base';
import { NestDomainEventPublisher } from '../shared/events/domain-event.publisher';
import { BookingApplicationService } from './booking/application/services/booking.application.service';
import { ExecutionProgressService } from './booking/application/services/execution-progress.service';
import { WorkspaceService } from './booking/application/services/workspace.service';
import { CustomerApplicationService } from './customer/application/services/customer.application.service';
import { InvoiceApplicationService } from './finance/application/services/invoice.application.service';
import { ProfitabilityApplicationService } from './finance/application/services/profitability.application.service';
import { VendorExpenseApplicationService } from './finance/application/services/vendor-expense.application.service';
import { InventoryMovementApplicationService } from './inventory/application/services/inventory-movement.application.service';
import { LeadApplicationService } from './lead/application/services/lead.application.service';
import { QuotationApplicationService } from './quotation/application/services/quotation.application.service';
import { QuotationLineItemApplicationService } from './quotation/application/services/quotation-line-item.application.service';
import { PaymentApplicationService } from './payment/application/services/payment.application.service';
import { StaffAssignmentApplicationService } from './staff/application/services/staff-assignment.application.service';
import { ChecklistItemApplicationService } from './task/application/services/checklist-item.application.service';
import { TaskApplicationService } from './task/application/services/task.application.service';
import { ProcurementLineApplicationService } from './vendor/application/services/procurement-line.application.service';
import { VendorApplicationService } from './vendor/application/services/vendor.application.service';
import { VendorProcurementApplicationService } from './vendor/application/services/vendor-procurement.application.service';
import { RepositoriesModule } from './repositories.module';

@Module({
  imports: [RepositoriesModule],
  providers: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    QuotationLineItemApplicationService,
    BookingApplicationService,
    WorkspaceService,
    ExecutionProgressService,
    { provide: DomainEventPublisher, useClass: NestDomainEventPublisher },
    { provide: AdvancePaymentQuery, useClass: PrismaAdvancePaymentQuery },
    PaymentApplicationService,
    TaskApplicationService,
    ChecklistItemApplicationService,
    StaffAssignmentApplicationService,
    InventoryMovementApplicationService,
    VendorApplicationService,
    VendorProcurementApplicationService,
    ProcurementLineApplicationService,
    InvoiceApplicationService,
    VendorExpenseApplicationService,
    ProfitabilityApplicationService,
  ],
  exports: [
    LeadApplicationService,
    CustomerApplicationService,
    QuotationApplicationService,
    QuotationLineItemApplicationService,
    BookingApplicationService,
    WorkspaceService,
    ExecutionProgressService,
    PaymentApplicationService,
    TaskApplicationService,
    ChecklistItemApplicationService,
    StaffAssignmentApplicationService,
    InventoryMovementApplicationService,
    VendorApplicationService,
    VendorProcurementApplicationService,
    ProcurementLineApplicationService,
    InvoiceApplicationService,
    VendorExpenseApplicationService,
    ProfitabilityApplicationService,
  ],
})
export class ApplicationServicesModule {}
