import { Module } from '@nestjs/common';
import { AuditModule } from '../shared/audit';
import { AdvancePaymentQuery } from '../shared/application/ports/advance-payment.query';
import { PrismaAdvancePaymentQuery } from '../shared/application/ports/advance-payment.query.impl';
import { DomainEventPublisher } from '../shared/events/domain-event.base';
import { NestDomainEventPublisher } from '../shared/events/domain-event.publisher';
import { SuggestionApplicationService } from './admin/application/services/suggestion.application.service';
import { BookingApplicationService } from './booking/application/services/booking.application.service';
import { ExecutionProgressService } from './booking/application/services/execution-progress.service';
import { WorkspaceService } from './booking/application/services/workspace.service';
import { WorkspaceProgressService } from './booking/application/services/workspace-progress.service';
import { WorkspaceActivityService } from './booking/application/services/workspace-activity.service';
import { EventNoteApplicationService } from './booking/application/services/event-note.application.service';
import { CustomerApplicationService } from './customer/application/services/customer.application.service';
import { ContactApplicationService } from './customer/application/services/contact.application.service';
import { IssueApplicationService } from './customer/application/services/issue.application.service';
import { ReviewRequestApplicationService } from './customer/application/services/review-request.application.service';
import { TimelineApplicationService } from './customer/application/services/timeline.application.service';
import { CustomerIntelligenceApplicationService } from './customer/application/services/customer-intelligence.application.service';
import { InvoiceApplicationService } from './finance/application/services/invoice.application.service';
import { ProfitabilityApplicationService } from './finance/application/services/profitability.application.service';
import { VendorExpenseApplicationService } from './finance/application/services/vendor-expense.application.service';
import { FinancialDocumentApplicationService } from './finance/application/services/financial-document.application.service';
import { CalendarApplicationService } from './calendar/application/services/calendar.application.service';
import { AnalyticsApplicationService } from './analytics/application/services/analytics.application.service';
import { CommunicationApplicationService } from './communication/application/services/communication.application.service';
import { CommunicationTemplateApplicationService } from './communication/application/services/communication-template.application.service';
import { ReminderApplicationService } from './communication/application/services/reminder.application.service';
import { NotificationPreferenceApplicationService } from './communication/application/services/notification-preference.application.service';
import { InventoryMovementApplicationService } from './inventory/application/services/inventory-movement.application.service';
import { InventoryApplicationService } from './inventory/application/services/inventory.application.service';
import { InventoryAvailabilityService } from './inventory/application/services/inventory-availability.service';
import { InventoryReservationApplicationService } from './inventory/application/services/inventory-reservation.application.service';
import { InventoryVerificationApplicationService } from './inventory/application/services/inventory-verification.application.service';
import { InventoryDamageReportApplicationService } from './inventory/application/services/inventory-damage-report.application.service';
import { LeadApplicationService } from './lead/application/services/lead.application.service';
import { QuotationApplicationService } from './quotation/application/services/quotation.application.service';
import { QuotationLineItemApplicationService } from './quotation/application/services/quotation-line-item.application.service';
import { PaymentApplicationService } from './payment/application/services/payment.application.service';
import { StaffAssignmentApplicationService } from './staff/application/services/staff-assignment.application.service';
import { StaffApplicationService } from './staff/application/services/staff.application.service';
import { StaffAvailabilityApplicationService } from './staff/application/services/staff-availability.application.service';
import { StaffLeaveApplicationService } from './staff/application/services/staff-leave.application.service';
import { SchedulingApplicationService } from './staff/application/services/scheduling.application.service';
import { ChecklistTemplateApplicationService } from './checklist/application/services/checklist-template.application.service';
import { EventChecklistApplicationService } from './checklist/application/services/event-checklist.application.service';
import { ChecklistItemApplicationService } from './task/application/services/checklist-item.application.service';
import { TaskApplicationService } from './task/application/services/task.application.service';
import { TenantSettingsApplicationService } from './tenant/application/services/tenant-settings.application.service';
import { ProcurementLineApplicationService } from './vendor/application/services/procurement-line.application.service';
import { VendorApplicationService } from './vendor/application/services/vendor.application.service';
import { VendorProcurementApplicationService } from './vendor/application/services/vendor-procurement.application.service';
import { RepositoriesModule } from './repositories.module';

@Module({
  imports: [RepositoriesModule, AuditModule],
  providers: [
    LeadApplicationService,
    CustomerApplicationService,
    ContactApplicationService,
    TimelineApplicationService,
    IssueApplicationService,
    ReviewRequestApplicationService,
    CustomerIntelligenceApplicationService,
    QuotationApplicationService,
    QuotationLineItemApplicationService,
    BookingApplicationService,
    WorkspaceService,
    WorkspaceProgressService,
    WorkspaceActivityService,
    EventNoteApplicationService,
    ExecutionProgressService,
    { provide: DomainEventPublisher, useClass: NestDomainEventPublisher },
    { provide: AdvancePaymentQuery, useClass: PrismaAdvancePaymentQuery },
    PaymentApplicationService,
    TaskApplicationService,
    ChecklistItemApplicationService,
    ChecklistTemplateApplicationService,
    EventChecklistApplicationService,
    SchedulingApplicationService,
    StaffAssignmentApplicationService,
    StaffApplicationService,
    StaffAvailabilityApplicationService,
    StaffLeaveApplicationService,
    SuggestionApplicationService,
    TenantSettingsApplicationService,
    InventoryApplicationService,
    InventoryAvailabilityService,
    InventoryMovementApplicationService,
    InventoryReservationApplicationService,
    InventoryVerificationApplicationService,
    InventoryDamageReportApplicationService,
    VendorApplicationService,
    VendorProcurementApplicationService,
    ProcurementLineApplicationService,
    InvoiceApplicationService,
    VendorExpenseApplicationService,
    ProfitabilityApplicationService,
    FinancialDocumentApplicationService,
    CommunicationApplicationService,
    CommunicationTemplateApplicationService,
    ReminderApplicationService,
    NotificationPreferenceApplicationService,
    CalendarApplicationService,
    AnalyticsApplicationService,
  ],
  exports: [
    LeadApplicationService,
    CustomerApplicationService,
    ContactApplicationService,
    TimelineApplicationService,
    IssueApplicationService,
    ReviewRequestApplicationService,
    CustomerIntelligenceApplicationService,
    QuotationApplicationService,
    QuotationLineItemApplicationService,
    BookingApplicationService,
    WorkspaceService,
    WorkspaceProgressService,
    WorkspaceActivityService,
    EventNoteApplicationService,
    ExecutionProgressService,
    PaymentApplicationService,
    TaskApplicationService,
    ChecklistItemApplicationService,
    ChecklistTemplateApplicationService,
    EventChecklistApplicationService,
    SchedulingApplicationService,
    StaffAssignmentApplicationService,
    StaffApplicationService,
    StaffAvailabilityApplicationService,
    StaffLeaveApplicationService,
    SuggestionApplicationService,
    TenantSettingsApplicationService,
    InventoryApplicationService,
    InventoryAvailabilityService,
    InventoryMovementApplicationService,
    InventoryReservationApplicationService,
    InventoryVerificationApplicationService,
    InventoryDamageReportApplicationService,
    VendorApplicationService,
    VendorProcurementApplicationService,
    ProcurementLineApplicationService,
    InvoiceApplicationService,
    VendorExpenseApplicationService,
    ProfitabilityApplicationService,
    FinancialDocumentApplicationService,
    CommunicationApplicationService,
    CommunicationTemplateApplicationService,
    ReminderApplicationService,
    NotificationPreferenceApplicationService,
    CalendarApplicationService,
    AnalyticsApplicationService,
  ],
})
export class ApplicationServicesModule {}
