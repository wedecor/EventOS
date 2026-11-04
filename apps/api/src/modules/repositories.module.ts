import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { SuggestionRepository } from './admin/domain/repositories/suggestion.repository';
import { SuggestionRepositoryImpl } from './admin/infrastructure/persistence/suggestion.repository.impl';
import { EventRepository } from './booking/domain/repositories/event.repository';
import { EventRepositoryImpl } from './booking/infrastructure/persistence/event.repository.impl';
import { EventNoteRepository } from './booking/domain/repositories/event-note.repository';
import { EventNoteRepositoryImpl } from './booking/infrastructure/persistence/event-note.repository.impl';
import { CustomerRepository } from './customer/domain/repositories/customer.repository';
import { CustomerRepositoryImpl } from './customer/infrastructure/persistence/customer.repository.impl';
import { ContactRepository } from './customer/domain/repositories/contact.repository';
import { ContactRepositoryImpl } from './customer/infrastructure/persistence/contact.repository.impl';
import { IssueNoteRepository } from './customer/domain/repositories/issue-note.repository';
import { IssueNoteRepositoryImpl } from './customer/infrastructure/persistence/issue-note.repository.impl';
import { ReviewRequestRepository } from './customer/domain/repositories/review-request.repository';
import { ReviewRequestRepositoryImpl } from './customer/infrastructure/persistence/review-request.repository.impl';
import { TimelineEntryRepository } from './customer/domain/repositories/timeline-entry.repository';
import { TimelineEntryRepositoryImpl } from './customer/infrastructure/persistence/timeline-entry.repository.impl';
import { InvoiceLineItemRepository } from './finance/domain/repositories/invoice-line-item.repository';
import { InvoiceLineItemRepositoryImpl } from './finance/infrastructure/persistence/invoice-line-item.repository.impl';
import { InvoiceRepository } from './finance/domain/repositories/invoice.repository';
import { InvoiceRepositoryImpl } from './finance/infrastructure/persistence/invoice.repository.impl';
import { VendorExpenseRepository } from './finance/domain/repositories/vendor-expense.repository';
import { VendorExpenseRepositoryImpl } from './finance/infrastructure/persistence/vendor-expense.repository.impl';
import { FinancialDocumentRepository } from './finance/domain/repositories/financial-document.repository';
import { FinancialDocumentRepositoryImpl } from './finance/infrastructure/persistence/financial-document.repository.impl';
import { FinancialDocumentAuditEventRepository } from './finance/domain/repositories/financial-document-audit-event.repository';
import { FinancialDocumentAuditEventRepositoryImpl } from './finance/infrastructure/persistence/financial-document-audit-event.repository.impl';
import { CommunicationAttachmentRepository } from './communication/domain/repositories/communication-attachment.repository';
import { CommunicationAttachmentRepositoryImpl } from './communication/infrastructure/persistence/communication-attachment.repository.impl';
import { CommunicationRecordRepository } from './communication/domain/repositories/communication-record.repository';
import { CommunicationRecordRepositoryImpl } from './communication/infrastructure/persistence/communication-record.repository.impl';
import { CommunicationTemplateRepository } from './communication/domain/repositories/communication-template.repository';
import { CommunicationTemplateRepositoryImpl } from './communication/infrastructure/persistence/communication-template.repository.impl';
import { NotificationPreferenceRepository } from './communication/domain/repositories/notification-preference.repository';
import { NotificationPreferenceRepositoryImpl } from './communication/infrastructure/persistence/notification-preference.repository.impl';
import { ReminderRepository } from './communication/domain/repositories/reminder.repository';
import { ReminderRepositoryImpl } from './communication/infrastructure/persistence/reminder.repository.impl';
import { InventoryMovementDamageNoteRepository } from './inventory/domain/repositories/inventory-movement-damage-note.repository';
import { InventoryItemRepository } from './inventory/domain/repositories/inventory-item.repository';
import { InventoryMovementRepository } from './inventory/domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from './inventory/domain/repositories/inventory-reservation.repository';
import { InventoryVerificationRepository } from './inventory/domain/repositories/inventory-verification.repository';
import { InventoryDamageReportRepository } from './inventory/domain/repositories/inventory-damage-report.repository';
import { InventoryMovementDamageNoteRepositoryImpl } from './inventory/infrastructure/persistence/inventory-movement-damage-note.repository.impl';
import { InventoryItemRepositoryImpl } from './inventory/infrastructure/persistence/inventory-item.repository.impl';
import { InventoryMovementRepositoryImpl } from './inventory/infrastructure/persistence/inventory-movement.repository.impl';
import { InventoryReservationRepositoryImpl } from './inventory/infrastructure/persistence/inventory-reservation.repository.impl';
import { InventoryVerificationRepositoryImpl } from './inventory/infrastructure/persistence/inventory-verification.repository.impl';
import { InventoryDamageReportRepositoryImpl } from './inventory/infrastructure/persistence/inventory-damage-report.repository.impl';
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
import { StaffMemberRepository } from './staff/domain/repositories/staff-member.repository';
import { StaffAvailabilityRepository } from './staff/domain/repositories/staff-availability.repository';
import { StaffLeaveRepository } from './staff/domain/repositories/staff-leave.repository';
import { StaffAssignmentRepositoryImpl } from './staff/infrastructure/persistence/staff-assignment.repository.impl';
import { StaffMemberRepositoryImpl } from './staff/infrastructure/persistence/staff-member.repository.impl';
import { StaffAvailabilityRepositoryImpl } from './staff/infrastructure/persistence/staff-availability.repository.impl';
import { StaffLeaveRepositoryImpl } from './staff/infrastructure/persistence/staff-leave.repository.impl';
import { ChecklistTemplateRepository } from './checklist/domain/repositories/checklist-template.repository';
import { ChecklistTemplateRepositoryImpl } from './checklist/infrastructure/persistence/checklist-template.repository.impl';
import { ChecklistTemplateItemRepository } from './checklist/domain/repositories/checklist-template-item.repository';
import { ChecklistTemplateItemRepositoryImpl } from './checklist/infrastructure/persistence/checklist-template-item.repository.impl';
import { EventChecklistRepository } from './checklist/domain/repositories/event-checklist.repository';
import { EventChecklistRepositoryImpl } from './checklist/infrastructure/persistence/event-checklist.repository.impl';
import { EventChecklistItemRepository } from './checklist/domain/repositories/event-checklist-item.repository';
import { EventChecklistItemRepositoryImpl } from './checklist/infrastructure/persistence/event-checklist-item.repository.impl';
import { ChecklistItemRepository } from './task/domain/repositories/checklist-item.repository';
import { ChecklistItemRepositoryImpl } from './task/infrastructure/persistence/checklist-item.repository.impl';
import { TaskRepository } from './task/domain/repositories/task.repository';
import { TaskRepositoryImpl } from './task/infrastructure/persistence/task.repository.impl';
import { TenantSettingsRepository } from './tenant/domain/repositories/tenant-settings.repository';
import { TenantSettingsRepositoryImpl } from './tenant/infrastructure/persistence/tenant-settings.repository.impl';
import { ProcurementLineIssueNoteRepository } from './vendor/domain/repositories/procurement-line-issue-note.repository';
import { ProcurementLineIssueNoteRepositoryImpl } from './vendor/infrastructure/persistence/procurement-line-issue-note.repository.impl';
import { ProcurementLineRepository } from './vendor/domain/repositories/procurement-line.repository';
import { ProcurementLineRepositoryImpl } from './vendor/infrastructure/persistence/procurement-line.repository.impl';
import { VendorIssueNoteRepository } from './vendor/domain/repositories/vendor-issue-note.repository';
import { VendorIssueNoteRepositoryImpl } from './vendor/infrastructure/persistence/vendor-issue-note.repository.impl';
import { VendorProcurementRepository } from './vendor/domain/repositories/vendor-procurement.repository';
import { VendorProcurementRepositoryImpl } from './vendor/infrastructure/persistence/vendor-procurement.repository.impl';
import { ProcurementQuoteRepository } from './vendor/domain/repositories/procurement-quote.repository';
import { ProcurementQuoteRepositoryImpl } from './vendor/infrastructure/persistence/procurement-quote.repository.impl';
import { PurchaseOrderRepository } from './vendor/domain/repositories/purchase-order.repository';
import { PurchaseOrderRepositoryImpl } from './vendor/infrastructure/persistence/purchase-order.repository.impl';
import { ProcurementTimelineEventRepository } from './vendor/domain/repositories/procurement-timeline-event.repository';
import { ProcurementTimelineEventRepositoryImpl } from './vendor/infrastructure/persistence/procurement-timeline-event.repository.impl';
import { VendorRepository } from './vendor/domain/repositories/vendor.repository';
import { VendorRepositoryImpl } from './vendor/infrastructure/persistence/vendor.repository.impl';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: SuggestionRepository,
      useClass: SuggestionRepositoryImpl,
    },
    {
      provide: TenantSettingsRepository,
      useClass: TenantSettingsRepositoryImpl,
    },
    { provide: LeadRepository, useClass: LeadRepositoryImpl },
    { provide: FollowUpRepository, useClass: FollowUpRepositoryImpl },
    { provide: CustomerRepository, useClass: CustomerRepositoryImpl },
    { provide: ContactRepository, useClass: ContactRepositoryImpl },
    { provide: IssueNoteRepository, useClass: IssueNoteRepositoryImpl },
    {
      provide: ReviewRequestRepository,
      useClass: ReviewRequestRepositoryImpl,
    },
    {
      provide: TimelineEntryRepository,
      useClass: TimelineEntryRepositoryImpl,
    },
    { provide: QuotationRepository, useClass: QuotationRepositoryImpl },
    {
      provide: QuotationLineItemRepository,
      useClass: QuotationLineItemRepositoryImpl,
    },
    { provide: EventRepository, useClass: EventRepositoryImpl },
    { provide: EventNoteRepository, useClass: EventNoteRepositoryImpl },
    { provide: PaymentRepository, useClass: PaymentRepositoryImpl },
    { provide: TaskRepository, useClass: TaskRepositoryImpl },
    {
      provide: ChecklistItemRepository,
      useClass: ChecklistItemRepositoryImpl,
    },
    {
      provide: ChecklistTemplateRepository,
      useClass: ChecklistTemplateRepositoryImpl,
    },
    {
      provide: ChecklistTemplateItemRepository,
      useClass: ChecklistTemplateItemRepositoryImpl,
    },
    {
      provide: EventChecklistRepository,
      useClass: EventChecklistRepositoryImpl,
    },
    {
      provide: EventChecklistItemRepository,
      useClass: EventChecklistItemRepositoryImpl,
    },
    {
      provide: StaffAssignmentRepository,
      useClass: StaffAssignmentRepositoryImpl,
    },
    {
      provide: StaffMemberRepository,
      useClass: StaffMemberRepositoryImpl,
    },
    {
      provide: StaffAvailabilityRepository,
      useClass: StaffAvailabilityRepositoryImpl,
    },
    {
      provide: StaffLeaveRepository,
      useClass: StaffLeaveRepositoryImpl,
    },
    {
      provide: InventoryItemRepository,
      useClass: InventoryItemRepositoryImpl,
    },
    {
      provide: InventoryMovementRepository,
      useClass: InventoryMovementRepositoryImpl,
    },
    {
      provide: InventoryMovementDamageNoteRepository,
      useClass: InventoryMovementDamageNoteRepositoryImpl,
    },
    {
      provide: InventoryReservationRepository,
      useClass: InventoryReservationRepositoryImpl,
    },
    {
      provide: InventoryVerificationRepository,
      useClass: InventoryVerificationRepositoryImpl,
    },
    {
      provide: InventoryDamageReportRepository,
      useClass: InventoryDamageReportRepositoryImpl,
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
      provide: ProcurementQuoteRepository,
      useClass: ProcurementQuoteRepositoryImpl,
    },
    {
      provide: PurchaseOrderRepository,
      useClass: PurchaseOrderRepositoryImpl,
    },
    {
      provide: ProcurementTimelineEventRepository,
      useClass: ProcurementTimelineEventRepositoryImpl,
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
    {
      provide: FinancialDocumentRepository,
      useClass: FinancialDocumentRepositoryImpl,
    },
    {
      provide: FinancialDocumentAuditEventRepository,
      useClass: FinancialDocumentAuditEventRepositoryImpl,
    },
    {
      provide: CommunicationRecordRepository,
      useClass: CommunicationRecordRepositoryImpl,
    },
    {
      provide: CommunicationTemplateRepository,
      useClass: CommunicationTemplateRepositoryImpl,
    },
    {
      provide: CommunicationAttachmentRepository,
      useClass: CommunicationAttachmentRepositoryImpl,
    },
    {
      provide: ReminderRepository,
      useClass: ReminderRepositoryImpl,
    },
    {
      provide: NotificationPreferenceRepository,
      useClass: NotificationPreferenceRepositoryImpl,
    },
  ],
  exports: [
    SuggestionRepository,
    TenantSettingsRepository,
    LeadRepository,
    FollowUpRepository,
    CustomerRepository,
    ContactRepository,
    IssueNoteRepository,
    ReviewRequestRepository,
    TimelineEntryRepository,
    QuotationRepository,
    QuotationLineItemRepository,
    EventRepository,
    EventNoteRepository,
    PaymentRepository,
    TaskRepository,
    ChecklistItemRepository,
    ChecklistTemplateRepository,
    ChecklistTemplateItemRepository,
    EventChecklistRepository,
    EventChecklistItemRepository,
    StaffAssignmentRepository,
    StaffMemberRepository,
    StaffAvailabilityRepository,
    StaffLeaveRepository,
    InventoryItemRepository,
    InventoryMovementRepository,
    InventoryMovementDamageNoteRepository,
    InventoryReservationRepository,
    InventoryVerificationRepository,
    InventoryDamageReportRepository,
    VendorRepository,
    VendorIssueNoteRepository,
    VendorProcurementRepository,
    ProcurementQuoteRepository,
    PurchaseOrderRepository,
    ProcurementTimelineEventRepository,
    ProcurementLineRepository,
    ProcurementLineIssueNoteRepository,
    InvoiceRepository,
    InvoiceLineItemRepository,
    VendorExpenseRepository,
    FinancialDocumentRepository,
    FinancialDocumentAuditEventRepository,
    CommunicationRecordRepository,
    CommunicationTemplateRepository,
    CommunicationAttachmentRepository,
    ReminderRepository,
    NotificationPreferenceRepository,
  ],
})
export class RepositoriesModule {}
