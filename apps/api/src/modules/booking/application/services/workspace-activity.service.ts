import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { EventRepository } from '../../domain/repositories/event.repository';
import { EventNoteRepository } from '../../domain/repositories/event-note.repository';
import { TaskRepository } from '../../../task/domain/repositories/task.repository';
import { StaffAssignmentRepository } from '../../../staff/domain/repositories/staff-assignment.repository';
import { InventoryMovementRepository } from '../../../inventory/domain/repositories/inventory-movement.repository';
import { InventoryReservationRepository } from '../../../inventory/domain/repositories/inventory-reservation.repository';
import { InventoryDamageReportRepository } from '../../../inventory/domain/repositories/inventory-damage-report.repository';
import { VendorProcurementRepository } from '../../../vendor/domain/repositories/vendor-procurement.repository';
import { ProcurementTimelineEventRepository } from '../../../vendor/domain/repositories/procurement-timeline-event.repository';
import { PaymentRepository } from '../../../payment/domain/repositories/payment.repository';
import { FinancialDocumentRepository } from '../../../finance/domain/repositories/financial-document.repository';
import { FinancialDocumentAuditEventRepository } from '../../../finance/domain/repositories/financial-document-audit-event.repository';
import { CommunicationRecordRepository } from '../../../communication/domain/repositories/communication-record.repository';
import { ReminderRepository } from '../../../communication/domain/repositories/reminder.repository';
import type { WorkspaceActivityItemDto } from '../dtos/workspace-ops.dto';

// P2-01 / P2-07 / P2-08 — Read-only activity feed aggregated from booking-scoped facts
@Injectable()
export class WorkspaceActivityService {
  constructor(
    private readonly eventRepository: EventRepository,
    private readonly eventNoteRepository: EventNoteRepository,
    private readonly taskRepository: TaskRepository,
    private readonly staffAssignmentRepository: StaffAssignmentRepository,
    private readonly inventoryMovementRepository: InventoryMovementRepository,
    private readonly inventoryReservationRepository: InventoryReservationRepository,
    private readonly inventoryDamageReportRepository: InventoryDamageReportRepository,
    private readonly vendorProcurementRepository: VendorProcurementRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly timelineEventRepository: ProcurementTimelineEventRepository,
    private readonly financialDocumentRepository: FinancialDocumentRepository,
    private readonly financialDocumentAuditEventRepository: FinancialDocumentAuditEventRepository,
    private readonly communicationRecordRepository: CommunicationRecordRepository,
    private readonly reminderRepository: ReminderRepository,
  ) {}

  async listActivity(
    tenantId: string,
    bookingId: string,
  ): Promise<Result<WorkspaceActivityItemDto[]>> {
    const booking = await this.eventRepository.findById(tenantId, bookingId);
    if (!booking) {
      return failure('NOT_FOUND', 'Booking not found.');
    }

    const [
      tasks,
      assignments,
      movements,
      procurements,
      payments,
      notes,
      procurementTimeline,
      reservations,
      damageReports,
      documents,
      communications,
      reminders,
    ] = await Promise.all([
      this.taskRepository.findByBookingId(tenantId, bookingId),
      this.staffAssignmentRepository.findByBookingId(tenantId, bookingId),
      this.inventoryMovementRepository.findByBookingId(tenantId, bookingId),
      this.vendorProcurementRepository.findByBookingId(tenantId, bookingId),
      this.paymentRepository.findByBookingId(tenantId, bookingId),
      this.eventNoteRepository.findByBookingId(tenantId, bookingId),
      this.timelineEventRepository.findByBookingId(tenantId, bookingId),
      this.inventoryReservationRepository.findByBookingId(tenantId, bookingId),
      this.inventoryDamageReportRepository.findByBookingId(tenantId, bookingId),
      this.financialDocumentRepository.findByBookingId(tenantId, bookingId, {
        includeDeleted: true,
      }),
      this.communicationRecordRepository.findByBookingId(tenantId, bookingId, {
        includeDeleted: true,
      }),
      this.reminderRepository.findByBookingId(tenantId, bookingId),
    ]);

    const documentAuditEvents =
      await this.financialDocumentAuditEventRepository.findByBookingDocumentIds(
        tenantId,
        documents.map((d) => d.id),
      );

    const items: WorkspaceActivityItemDto[] = [];

    items.push({
      id: `booking-created-${booking.id}`,
      type: 'booking_created',
      title: 'Booking Created',
      occurredAt: booking.createdAt,
      entityType: 'Event',
      entityId: booking.id,
    });

    if (
      booking.workspaceStatus === 'active' ||
      booking.workspaceStatus === 'archived'
    ) {
      items.push({
        id: `workspace-activated-${booking.id}`,
        type: 'workspace_activated',
        title: 'Workspace Activated',
        occurredAt: booking.updatedAt,
        entityType: 'Event',
        entityId: booking.id,
      });
    }

    for (const task of tasks) {
      items.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        title: `Task Created: ${task.title}`,
        occurredAt: task.createdAt,
        entityType: 'Task',
        entityId: task.id,
      });
      if (task.status === 'completed' && task.completedAt) {
        items.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          title: `Task Completed: ${task.title}`,
          occurredAt: task.completedAt,
          entityType: 'Task',
          entityId: task.id,
        });
      }
    }

    for (const assignment of assignments) {
      items.push({
        id: `staff-assigned-${assignment.id}`,
        type: 'staff_assigned',
        title: `Staff Assigned${assignment.role ? `: ${assignment.role}` : ''}`,
        occurredAt: assignment.createdAt,
        entityType: 'StaffAssignment',
        entityId: assignment.id,
      });
      if (assignment.confirmedAt) {
        items.push({
          id: `staff-confirmed-${assignment.id}`,
          type: 'staff_confirmed',
          title: 'Staff Assignment Confirmed',
          occurredAt: assignment.confirmedAt,
          entityType: 'StaffAssignment',
          entityId: assignment.id,
        });
      }
    }

    for (const procurement of procurements) {
      items.push({
        id: `vendor-assigned-${procurement.id}`,
        type: 'vendor_assigned',
        title: 'Vendor Assigned',
        occurredAt: procurement.createdAt,
        entityType: 'VendorProcurement',
        entityId: procurement.id,
      });
    }

    for (const event of procurementTimeline) {
      if (event.eventType === 'request_created') continue;
      items.push({
        id: `procurement-${event.eventType}-${event.id}`,
        type: `procurement_${event.eventType}`,
        title: event.message,
        occurredAt: event.occurredAt,
        entityType: 'VendorProcurement',
        entityId: event.vendorProcurementId,
      });
    }

    for (const reservation of reservations) {
      items.push({
        id: `inventory-reserved-${reservation.id}`,
        type: 'inventory_reserved',
        title: 'Inventory Reserved',
        occurredAt: reservation.createdAt,
        entityType: 'InventoryReservation',
        entityId: reservation.id,
      });
    }

    for (const movement of movements) {
      // Keep Phase 1 create signal when no reservation link
      if (!movement.reservationId) {
        items.push({
          id: `inventory-planned-${movement.id}`,
          type: 'inventory_reserved',
          title: 'Inventory Movement Planned',
          occurredAt: movement.createdAt,
          entityType: 'InventoryMovement',
          entityId: movement.id,
        });
      }

      const lifecycle: Array<{
        at: Date | null;
        type: string;
        title: string;
      }> = [
        {
          at: movement.packingStartedAt,
          type: 'inventory_packing_started',
          title: 'Inventory Packing Started',
        },
        {
          at: movement.packedAt,
          type: 'inventory_packed',
          title: 'Inventory Packed',
        },
        {
          at: movement.verifiedAt,
          type: 'inventory_verified',
          title: 'Inventory Verified',
        },
        {
          at: movement.loadedAt,
          type: 'inventory_loaded',
          title: 'Inventory Loaded',
        },
        {
          at: movement.dispatchedAt,
          type: 'inventory_dispatched',
          title: 'Inventory Dispatched',
        },
        {
          at: movement.returnedAt,
          type: 'inventory_returned',
          title: 'Inventory Returned',
        },
        {
          at: movement.returnVerifiedAt,
          type: 'inventory_return_verified',
          title: 'Inventory Return Verified',
        },
      ];

      for (const entry of lifecycle) {
        if (!entry.at) continue;
        items.push({
          id: `${entry.type}-${movement.id}`,
          type: entry.type,
          title: entry.title,
          occurredAt: entry.at,
          entityType: 'InventoryMovement',
          entityId: movement.id,
        });
      }
    }

    for (const report of damageReports) {
      items.push({
        id: `inventory-damage-${report.id}`,
        type: 'inventory_damage_reported',
        title: 'Inventory Damage Reported',
        occurredAt: report.createdAt,
        entityType: 'InventoryDamageReport',
        entityId: report.id,
      });
    }

    for (const payment of payments) {
      if (payment.status === 'confirmed') {
        items.push({
          id: `payment-received-${payment.id}`,
          type: 'payment_received',
          title: 'Payment Received',
          occurredAt: payment.receivedAt,
          entityType: 'Payment',
          entityId: payment.id,
        });
      }
    }

    for (const event of documentAuditEvents) {
      const titles: Record<string, string> = {
        uploaded: 'Document Uploaded',
        updated: 'Document Updated',
        verified: 'Document Verified',
        rejected: 'Document Rejected',
        deleted: 'Document Removed',
      };
      items.push({
        id: `finance-doc-${event.eventType}-${event.id}`,
        type: `document_${event.eventType}`,
        title: titles[event.eventType] ?? event.message,
        occurredAt: event.occurredAt,
        entityType: 'FinancialDocument',
        entityId: event.financialDocumentId,
      });
    }

    for (const communication of communications) {
      items.push({
        id: `communication-created-${communication.id}`,
        type: 'communication_created',
        title: 'Communication Created',
        occurredAt: communication.createdAt,
        entityType: 'CommunicationRecord',
        entityId: communication.id,
      });
      if (communication.sentAt) {
        items.push({
          id: `communication-sent-${communication.id}`,
          type: 'communication_sent',
          title: 'Communication Sent',
          occurredAt: communication.sentAt,
          entityType: 'CommunicationRecord',
          entityId: communication.id,
        });
      }
      if (communication.deliveredAt) {
        items.push({
          id: `communication-delivered-${communication.id}`,
          type: 'communication_delivered',
          title: 'Communication Delivered',
          occurredAt: communication.deliveredAt,
          entityType: 'CommunicationRecord',
          entityId: communication.id,
        });
      }
      if (communication.readAt) {
        items.push({
          id: `communication-read-${communication.id}`,
          type: 'communication_read',
          title: 'Communication Read',
          occurredAt: communication.readAt,
          entityType: 'CommunicationRecord',
          entityId: communication.id,
        });
      }
      if (communication.failedAt) {
        items.push({
          id: `communication-failed-${communication.id}`,
          type: 'communication_failed',
          title: 'Communication Failed',
          occurredAt: communication.failedAt,
          entityType: 'CommunicationRecord',
          entityId: communication.id,
        });
      }
    }

    for (const reminder of reminders) {
      items.push({
        id: `reminder-created-${reminder.id}`,
        type: 'reminder_created',
        title: `Reminder Created: ${reminder.title}`,
        occurredAt: reminder.createdAt,
        entityType: 'Reminder',
        entityId: reminder.id,
      });
      if (reminder.completedAt) {
        items.push({
          id: `reminder-completed-${reminder.id}`,
          type: 'reminder_completed',
          title: `Reminder Completed: ${reminder.title}`,
          occurredAt: reminder.completedAt,
          entityType: 'Reminder',
          entityId: reminder.id,
        });
      }
      if (reminder.cancelledAt) {
        items.push({
          id: `reminder-cancelled-${reminder.id}`,
          type: 'reminder_cancelled',
          title: `Reminder Cancelled: ${reminder.title}`,
          occurredAt: reminder.cancelledAt,
          entityType: 'Reminder',
          entityId: reminder.id,
        });
      }
    }

    for (const note of notes) {
      items.push({
        id: `note-${note.id}`,
        type: 'internal_note',
        title: 'Internal Note Added',
        occurredAt: note.createdAt,
        entityType: 'EventNote',
        entityId: note.id,
      });
    }

    if (booking.status === 'in_execution') {
      items.push({
        id: `event-started-${booking.id}`,
        type: 'event_started',
        title: 'Event Started',
        occurredAt: booking.updatedAt,
        entityType: 'Event',
        entityId: booking.id,
      });
    }

    if (booking.completedAt) {
      items.push({
        id: `event-completed-${booking.id}`,
        type: 'event_completed',
        title: 'Event Completed',
        occurredAt: booking.completedAt,
        entityType: 'Event',
        entityId: booking.id,
      });
    }

    items.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

    return success(items);
  }
}
