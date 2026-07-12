import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { BookingApplicationService } from '../application/services/booking.application.service';
import { ExecutionProgressService } from '../application/services/execution-progress.service';
import { WorkspaceService } from '../application/services/workspace.service';
import { PaymentApplicationService } from '../../payment/application/services/payment.application.service';
import { InventoryMovementApplicationService } from '../../inventory/application/services/inventory-movement.application.service';
import {
  activateWorkspaceSchema,
  advanceExecutionStageSchema,
  cancelBookingSchema,
  completeBookingSchema,
  updateBookingStatusSchema,
  type AdvanceExecutionStageBody,
  type CancelBookingBody,
  type UpdateBookingStatusBody,
} from './schemas/booking.schemas';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingApplicationService,
    private readonly workspaceService: WorkspaceService,
    private readonly executionProgressService: ExecutionProgressService,
    private readonly paymentService: PaymentApplicationService,
    private readonly inventoryMovementService: InventoryMovementApplicationService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a booking by ID' })
  async retrieveBooking(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.bookingService.retrieveBooking(tenantId, id);
    return resultToResponse(result);
  }

  @Get(':id/payments')
  @ApiOperation({ summary: 'List payments for a booking' })
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

  // EP1-INV-003 — List inventory movements for a booking (Event Workspace integration)
  @Get(':id/inventory-movements')
  @ApiOperation({ summary: 'List inventory movements for a booking' })
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

  // EP1-OPS-001, EP1-AUT-002 — Activate workspace
  @Post(':id/activate-workspace')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate workspace for an approved event' })
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
  @ApiOperation({ summary: 'Get workspace view for a booking' })
  async getWorkspace(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.workspaceService.getWorkspace(tenantId, id);
    return resultToResponse(result);
  }

  // PATCH status (activate booking: approved → in_preparation)
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update booking status' })
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
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a booking' })
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

  // EP1-BR-002 — Complete booking (stub)
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete a booking' })
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

  // EP1-OPS-004, EP1-BR-003 — Advance execution stage
  @Post(':id/execution-stages/advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Advance execution stage for a booking' })
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
