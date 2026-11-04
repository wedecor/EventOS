import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { BookingApplicationService } from '../application/services/booking.application.service';
import { ExecutionProgressService } from '../application/services/execution-progress.service';
import { WorkspaceService } from '../application/services/workspace.service';
import { WorkspaceProgressService } from '../application/services/workspace-progress.service';
import { WorkspaceActivityService } from '../application/services/workspace-activity.service';
import { EventNoteApplicationService } from '../application/services/event-note.application.service';
import { PaymentApplicationService } from '../../payment/application/services/payment.application.service';
import { InventoryMovementApplicationService } from '../../inventory/application/services/inventory-movement.application.service';
import { InventoryReservationApplicationService } from '../../inventory/application/services/inventory-reservation.application.service';
import { VendorProcurementApplicationService } from '../../vendor/application/services/vendor-procurement.application.service';
import { InvoiceApplicationService } from '../../finance/application/services/invoice.application.service';
import { ProfitabilityApplicationService } from '../../finance/application/services/profitability.application.service';
import { VendorExpenseApplicationService } from '../../finance/application/services/vendor-expense.application.service';
import { FinancialDocumentApplicationService } from '../../finance/application/services/financial-document.application.service';
import { CommunicationApplicationService } from '../../communication/application/services/communication.application.service';
import { ReminderApplicationService } from '../../communication/application/services/reminder.application.service';
import {
  createVendorProcurementSchema,
  type CreateVendorProcurementBody,
} from '../../vendor/presentation/schemas/vendor-procurement.schemas';
import {
  recordExpenseSchema,
  type RecordExpenseBody,
} from '../../finance/presentation/schemas/vendor-expense.schemas';
import {
  activateWorkspaceSchema,
  advanceExecutionStageSchema,
  assignExecutionOwnerSchema,
  cancelBookingSchema,
  completeBookingSchema,
  createEventNoteSchema,
  updateBookingStatusSchema,
  type AdvanceExecutionStageBody,
  type AssignExecutionOwnerBody,
  type CancelBookingBody,
  type CreateEventNoteBody,
  type UpdateBookingStatusBody,
} from './schemas/booking.schemas';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingApplicationService,
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceProgressService: WorkspaceProgressService,
    private readonly workspaceActivityService: WorkspaceActivityService,
    private readonly eventNoteService: EventNoteApplicationService,
    private readonly executionProgressService: ExecutionProgressService,
    private readonly paymentService: PaymentApplicationService,
    private readonly inventoryMovementService: InventoryMovementApplicationService,
    private readonly inventoryReservationService: InventoryReservationApplicationService,
    private readonly vendorProcurementService: VendorProcurementApplicationService,
    private readonly invoiceService: InvoiceApplicationService,
    private readonly expenseService: VendorExpenseApplicationService,
    private readonly profitabilityService: ProfitabilityApplicationService,
    private readonly financialDocumentService: FinancialDocumentApplicationService,
    private readonly communicationService: CommunicationApplicationService,
    private readonly reminderService: ReminderApplicationService,
  ) {}

  @Get(':id')
  @Permissions('bookings:read')
  @ApiOperation({ summary: 'Retrieve a booking by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Booking retrieved')
  @ApiStandardErrors()
  async retrieveBooking(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.bookingService.retrieveBooking(tenantId, id);
    return resultToResponse(result);
  }

  @Get(':id/payments')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'List payments for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Payments listed')
  @ApiStandardErrors()
  async listPaymentsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.paymentService.listPaymentsForBooking(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // P2-08 — List financial documents for a booking
  @Get(':id/financial-documents')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List financial documents for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Financial documents listed')
  @ApiStandardErrors()
  async listFinancialDocumentsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.financialDocumentService.listForBooking(tenantId, id),
    );
  }

  // P2-09 — List communications for a booking
  @Get(':id/communications')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List communications for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Communications listed')
  @ApiStandardErrors()
  async listCommunicationsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.communicationService.listByBooking(tenantId, id),
    );
  }

  // P2-09 — List reminders for a booking
  @Get(':id/reminders')
  @Permissions('reminders:read')
  @ApiOperation({ summary: 'List reminders for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Reminders listed')
  @ApiStandardErrors()
  async listRemindersForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.reminderService.listByBooking(tenantId, id),
    );
  }

  // EP1-INV-003 — List inventory movements for a booking (Event Workspace integration)
  @Get(':id/inventory-movements')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List inventory movements for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Inventory movements listed')
  @ApiStandardErrors()
  async listInventoryMovementsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.inventoryMovementService.listMovementsForBooking(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // P2-07 — List inventory reservations for a booking
  @Get(':id/inventory-reservations')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List inventory reservations for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Inventory reservations listed')
  @ApiStandardErrors()
  async listInventoryReservationsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.inventoryReservationService.listReservationsForBooking(
        tenantId,
        id,
      ),
    );
  }

  // EP1-VEN-002 — List vendor procurements for a booking (Event Workspace integration)
  @Get(':id/procurements')
  @Permissions('procurements:read')
  @ApiOperation({ summary: 'List vendor procurements for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Procurements listed')
  @ApiStandardErrors()
  async listProcurementsForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result =
      await this.vendorProcurementService.listProcurementsForBooking(
        tenantId,
        id,
      );
    return resultToResponse(result);
  }

  // EP1-VEN-002 — Create a vendor procurement header for a booking
  @Post(':id/procurements')
  @Permissions('procurements:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a vendor procurement for a booking' })
  @ApiUuidParam('id')
  @ApiZodBody(createVendorProcurementSchema)
  @ApiDataResponse(201, 'Procurement created')
  @ApiStandardErrors()
  async createProcurement(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createVendorProcurementSchema))
    body: CreateVendorProcurementBody,
  ) {
    const result = await this.vendorProcurementService.createProcurement(
      tenantId,
      id,
      {
        vendorId: body.vendorId,
        notes: body.notes,
        serviceCategory: body.serviceCategory,
        requiredDate: body.requiredDate,
        estimatedCost: body.estimatedCost,
      },
    );
    return resultToResponse(result);
  }

  // EP1-FIN-002 — List invoices for a booking (Event Workspace / financial-review integration)
  @Get(':id/invoices')
  @Permissions('invoices:read')
  @ApiOperation({ summary: 'List invoices for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Invoices listed')
  @ApiStandardErrors()
  async listInvoicesForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.invoiceService.listInvoicesForBooking(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // EP1-FIN-004 — List vendor expenses for a booking (Event Workspace integration)
  @Get(':id/expenses')
  @Permissions('expenses:read')
  @ApiOperation({ summary: 'List vendor expenses for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Expenses listed')
  @ApiStandardErrors()
  async listExpensesForBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.expenseService.listExpensesForBooking(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // EP1-FIN-004 — Record a vendor expense for a booking
  @Post(':id/expenses')
  @Permissions('expenses:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a vendor expense for a booking' })
  @ApiUuidParam('id')
  @ApiZodBody(recordExpenseSchema)
  @ApiDataResponse(201, 'Expense recorded')
  @ApiStandardErrors()
  async recordExpense(
    @CurrentUser() user: AuthenticatedUser,
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(recordExpenseSchema))
    body: RecordExpenseBody,
  ) {
    const result = await this.expenseService.recordExpense(
      user.userId,
      tenantId,
      id,
      {
        vendorId: body.vendorId,
        procurementLineId: body.procurementLineId,
        amount: body.amount,
        currency: body.currency,
        method: body.method,
        paidAt: new Date(body.paidAt),
        attachmentId: body.attachmentId,
        notes: body.notes,
      },
    );
    return resultToResponse(result);
  }

  // EP1-FIN-005 — Event profitability view (Event Workspace integration)
  @Get(':id/profitability')
  @Permissions('profitability:read')
  @ApiOperation({ summary: 'Get profitability view for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Profitability retrieved')
  @ApiStandardErrors()
  async getProfitability(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.profitabilityService.getProfitability(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // EP1-OPS-001, EP1-AUT-002 — Activate workspace
  @Post(':id/activate-workspace')
  @Permissions('workspace:activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate workspace for an approved event' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(activateWorkspaceSchema)
  @ApiDataResponse(200, 'Workspace activated')
  @ApiStandardErrors()
  async activateWorkspace(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(activateWorkspaceSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.workspaceService.activateWorkspace(tenantId, id, {
      version,
    });
    return resultToResponse(result);
  }

  // EP1-AUT-006 — Get workspace view
  @Get(':id/workspace')
  @Permissions('workspace:read')
  @ApiOperation({ summary: 'Get workspace view for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Workspace retrieved')
  @ApiStandardErrors()
  async getWorkspace(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.workspaceService.getWorkspace(tenantId, id);
    return resultToResponse(result);
  }

  // P2-01 — Computed workspace progress
  @Get(':id/workspace/progress')
  @Permissions('workspace:read')
  @ApiOperation({ summary: 'Get computed workspace progress for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Workspace progress retrieved')
  @ApiStandardErrors()
  async getWorkspaceProgress(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.workspaceProgressService.getProgress(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // P2-01 — Aggregated activity feed
  @Get(':id/workspace/activity')
  @Permissions('workspace:read')
  @ApiOperation({ summary: 'Get workspace activity feed for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Workspace activity retrieved')
  @ApiStandardErrors()
  async getWorkspaceActivity(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.workspaceActivityService.listActivity(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // P2-01 — Internal operational notes
  @Get(':id/notes')
  @Permissions('workspace:read')
  @ApiOperation({ summary: 'List internal notes for a booking' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Notes listed')
  @ApiStandardErrors()
  async listNotes(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.eventNoteService.listNotes(tenantId, id);
    return resultToResponse(result);
  }

  @Post(':id/notes')
  @Permissions('workspace:notes:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an internal note for a booking' })
  @ApiUuidParam('id')
  @ApiZodBody(createEventNoteSchema)
  @ApiDataResponse(201, 'Note created')
  @ApiStandardErrors()
  async createNote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createEventNoteSchema))
    body: CreateEventNoteBody,
  ) {
    const result = await this.eventNoteService.createNote(tenantId, id, {
      body: body.body,
      createdByUserId: user.userId,
    });
    return resultToResponse(result);
  }

  @Delete(':id/notes/:noteId')
  @Permissions('workspace:notes:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an internal note' })
  @ApiUuidParam('id')
  @ApiUuidParam('noteId')
  @ApiDataResponse(204, 'Note deleted')
  @ApiStandardErrors()
  async deleteNote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('noteId') noteId: string,
  ) {
    const result = await this.eventNoteService.deleteNote(tenantId, id, noteId);
    if (!result.ok) {
      return resultToResponse(result);
    }
  }

  // PATCH status (activate booking: approved → in_preparation)
  @Patch(':id/status')
  @Permissions('bookings:status:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateBookingStatusSchema)
  @ApiDataResponse(200, 'Booking status updated')
  @ApiStandardErrors()
  async updateBookingStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateBookingStatusSchema))
    body: UpdateBookingStatusBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    if (body.status === 'in_preparation') {
      const result = await this.bookingService.activateBooking(tenantId, id, {
        version,
      });
      return resultToResponse(result);
    }

    return resultToResponse(
      failure(
        'INVALID_STATE',
        `Status transition to '${body.status}' is not supported via this endpoint. Use the specific action endpoints.`,
      ),
    );
  }

  // Cancel booking
  @Post(':id/cancel')
  @Permissions('bookings:cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(cancelBookingSchema)
  @ApiDataResponse(200, 'Booking cancelled')
  @ApiStandardErrors()
  async cancelBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(cancelBookingSchema)) body: CancelBookingBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.bookingService.cancelBooking(tenantId, id, {
      reason: body.reason,
      version,
    });
    return resultToResponse(result);
  }

  // EP1-BR-002 — Complete booking
  @Post(':id/complete')
  @Permissions('bookings:complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a booking' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(completeBookingSchema)
  @ApiDataResponse(200, 'Booking completed')
  @ApiStandardErrors()
  async completeBooking(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(completeBookingSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.bookingService.completeBooking(tenantId, id, {
      version,
    });
    return resultToResponse(result);
  }

  // EP1-BR-003 — Assign (or reassign) the execution owner for a booking. Required
  // before execution stages can advance (see advance-execution-stage endpoint below).
  @Post(':id/execution-owner')
  @Permissions('bookings:execution:advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign the execution owner for a booking' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(assignExecutionOwnerSchema)
  @ApiDataResponse(200, 'Execution owner assigned')
  @ApiStandardErrors()
  async assignExecutionOwner(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(assignExecutionOwnerSchema))
    body: AssignExecutionOwnerBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.executionProgressService.assignExecutionOwner(
      tenantId,
      id,
      { executionOwnerId: body.executionOwnerId, version },
    );
    return resultToResponse(result);
  }

  // EP1-OPS-004, EP1-BR-003 — Advance execution stage
  @Post(':id/execution-stages/advance')
  @Permissions('bookings:execution:advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance execution stage for a booking' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(advanceExecutionStageSchema)
  @ApiDataResponse(200, 'Execution stage advanced')
  @ApiStandardErrors()
  async advanceExecutionStage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(advanceExecutionStageSchema))
    body: AdvanceExecutionStageBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.executionProgressService.advanceStage(
      tenantId,
      id,
      {
        milestoneKey: body.milestoneKey,
        preparationStatus: body.preparationStatus,
        version,
      },
    );
    return resultToResponse(result);
  }
}
