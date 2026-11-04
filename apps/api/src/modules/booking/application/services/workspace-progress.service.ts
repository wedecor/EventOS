import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../domain/repositories/event.repository';
import { EventChecklistItemRepository } from '../../../checklist/domain/repositories/event-checklist-item.repository';
import { ChecklistItemRepository } from '../../../task/domain/repositories/checklist-item.repository';
import { TaskRepository } from '../../../task/domain/repositories/task.repository';
import { StaffAssignmentRepository } from '../../../staff/domain/repositories/staff-assignment.repository';
import { InventoryMovementRepository } from '../../../inventory/domain/repositories/inventory-movement.repository';
import { InventoryMovementDamageNoteRepository } from '../../../inventory/domain/repositories/inventory-movement-damage-note.repository';
import { InventoryDamageReportRepository } from '../../../inventory/domain/repositories/inventory-damage-report.repository';
import { InventoryReservationRepository } from '../../../inventory/domain/repositories/inventory-reservation.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { FinancialDocumentRepository } from '../../../finance/domain/repositories/financial-document.repository';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../../communication/domain/repositories/reminder.repository';
import type { WorkspaceProgressDto } from '../dtos/workspace-ops.dto';

const TERMINAL_PROCUREMENT = new Set([
  'completed',
  'materials_delivered',
  'cancelled',
]);
const TERMINAL_MOVEMENT = new Set([
  'returned',
  'return_verified',
  'cleaned_ready',
  'cancelled',
]);

const RESERVED_STATUSES = new Set(['planned', 'picked', 'packing_started']);
const PACKED_STATUSES = new Set(['packed', 'verified', 'ready_for_dispatch']);
const LOADED_STATUSES = new Set(['loaded', 'dispatched', 'at_venue']);
const RETURNED_STATUSES = new Set([
  'returned',
  'return_verified',
  'cleaned_ready',
]);

// P2-01 / P2-02 / P2-07 — Computed workspace progress
@Injectable()
export class WorkspaceProgressService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly taskRepository: TaskRepository,
    private readonly checklistItemRepository: ChecklistItemRepository,
    private readonly eventChecklistItemRepository: EventChecklistItemRepository,
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly damageNoteRepository: InventoryMovementDamageNoteRepository,
    private readonly damageReportRepository: InventoryDamageReportRepository,
    private readonly reservationRepository: InventoryReservationRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly financialDocumentRepository: FinancialDocumentRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
    private readonly reminderRepository: ReminderRepository,
  ) {}

  async getProgress(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<WorkspaceProgressDto>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const [
      tasks,
      assignments,
      movements,
      procurements,
      eventChecklistItems,
      reservations,
      damageReports,
      payments,
      documents,
      communications,
      reminders,
    ] = await Promise.all([
      this.taskRepository.findByBookingId(tenantId, bookingId),
      this.staffAssignmentRepository.findByBookingId(tenantId, bookingId),
      this.inventoryMovementRepository.findByBookingId(tenantId, bookingId),
      this.vendorProcurementRepository.findByBookingId(tenantId, bookingId),
      this.eventChecklistItemRepository.findByBookingId(tenantId, bookingId),
      this.reservationRepository.findByBookingId(tenantId, bookingId),
      this.damageReportRepository.findByBookingId(tenantId, bookingId),
      this.paymentRepository.findByBookingId(tenantId, bookingId),
      this.financialDocumentRepository.findByBookingId(tenantId, bookingId),
      this.communicationRecordRepository.findByBookingId(tenantId, bookingId),
      this.reminderRepository.findByBookingId(tenantId, bookingId),
    ]);

    const activeTasks = tasks.filter((t) => t.status !== 'cancelled');
    const tasksComplete = activeTasks.filter(
      (t) => t.status === 'completed',
    ).length;
    const tasksTotal = activeTasks.length;

    const taskChecklistLists = await Promise.all(
      tasks.map((task) =>
        this.checklistItemRepository.findByTaskId(tenantId, task.id),
      ),
    );
    const taskChecklistItems = taskChecklistLists.flat();

    const checklistItems =
      eventChecklistItems.length > 0 ? eventChecklistItems : taskChecklistItems;

    const checklistComplete = checklistItems.filter(
      (i) => i.isCompleted,
    ).length;
    const checklistTotal = checklistItems.length;

    const openTasks = activeTasks.filter(
      (t) => t.status !== 'completed',
    ).length;
    const incompleteChecklist = checklistItems.filter(
      (i) => !i.isCompleted,
    ).length;
    const proposedStaff = assignments.filter(
      (a) => a.status === 'proposed',
    ).length;
    const openProcurements = procurements.filter(
      (p) => !TERMINAL_PROCUREMENT.has(p.workflowStatus),
    ).length;
    const openMovements = movements.filter(
      (m) => !TERMINAL_MOVEMENT.has(m.status),
    ).length;
    const openReservations = reservations.filter(
      (r) => r.status === 'reserved',
    ).length;

    const outstandingInventoryActions = openMovements + openReservations;

    const confirmedPayments = payments.filter((p) => p.status === 'confirmed');
    const paymentIdsWithProof = new Set(
      documents
        .filter((d) => d.paymentId && d.documentType === 'payment_proof')
        .map((d) => d.paymentId as string),
    );
    const missingPaymentProofs = confirmedPayments.filter(
      (p) =>
        !paymentIdsWithProof.has(p.id) &&
        !p.attachmentId &&
        !p.missingProofReason,
    ).length;

    const pendingVerification = documents.filter(
      (d) => d.verificationStatus === 'pending',
    ).length;
    const verified = documents.filter(
      (d) => d.verificationStatus === 'verified',
    ).length;
    const rejected = documents.filter(
      (d) => d.verificationStatus === 'rejected',
    ).length;
    const financeOutstanding =
      pendingVerification + rejected + missingPaymentProofs;

    const failedCommunications = communications.filter(
      (c) => c.status === 'failed',
    ).length;
    const now = new Date();
    const pendingReminders = reminders.filter(
      (r) => r.status === 'pending',
    ).length;
    const overdueReminders = reminders.filter(
      (r) => r.status === 'pending' && r.dueAt < now,
    ).length;
    const communicationOutstanding = failedCommunications + pendingReminders;

    const pendingActions =
      openTasks +
      incompleteChecklist +
      proposedStaff +
      openProcurements +
      outstandingInventoryActions +
      financeOutstanding +
      communicationOutstanding;

    const workUnits = tasksTotal + checklistTotal;
    const workDone = tasksComplete + checklistComplete;
    const overallCompletionPercent =
      workUnits === 0 ? 0 : Math.round((workDone / workUnits) * 100);

    const movementsWithLegacyDamage = new Set<string>();
    for (const movement of movements) {
      const notes = await this.damageNoteRepository.findByMovementId(
        tenantId,
        movement.id,
      );
      if (notes.length > 0) {
        movementsWithLegacyDamage.add(movement.id);
      }
    }
    for (const report of damageReports) {
      movementsWithLegacyDamage.add(report.movementId);
    }

    const inventory = {
      reserved:
        movements.filter((m) => RESERVED_STATUSES.has(m.status)).length +
        openReservations,
      packed: movements.filter((m) => PACKED_STATUSES.has(m.status)).length,
      loaded: movements.filter((m) => LOADED_STATUSES.has(m.status)).length,
      returned: movements.filter((m) => RETURNED_STATUSES.has(m.status)).length,
      damaged: movementsWithLegacyDamage.size,
      outstandingActions: outstandingInventoryActions,
    };

    return success({
      eventId: bookingId,
      overallCompletionPercent,
      tasksComplete,
      tasksTotal,
      checklistComplete,
      checklistTotal,
      pendingActions,
      inventory,
      financeDocuments: {
        total: documents.length,
        pendingVerification,
        verified,
        rejected,
        missingPaymentProofs,
        outstandingActions: financeOutstanding,
      },
      communications: {
        total: communications.length,
        failed: failedCommunications,
        pendingReminders,
        overdueReminders,
        outstandingActions: communicationOutstanding,
      },
    });
  }
}
