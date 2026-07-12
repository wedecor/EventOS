import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { StaffAssignmentApplicationService } from '../application/services/staff-assignment.application.service';
import {
  cancelStaffAssignmentSchema,
  confirmStaffAssignmentSchema,
  createStaffAssignmentSchema,
  releaseStaffAssignmentSchema,
  type CancelStaffAssignmentBody,
  type CreateStaffAssignmentBody,
} from './schemas/staff-assignment.schemas';

@ApiTags('Staff Assignments')
@ApiBearerAuth()
@Controller('staff-assignments')
export class StaffAssignmentController {
  constructor(
    private readonly staffAssignmentService: StaffAssignmentApplicationService,
  ) {}

  // EP1-STF-002 — List staff assignments for a booking (Event Workspace integration)
  @Get()
  @ApiOperation({ summary: 'List staff assignments for a booking' })
  async listAssignments(
    @TenantId() tenantId: string,
    @Query('bookingId') bookingId: string | undefined,
  ) {
    if (!bookingId) {
      return resultToResponse(
        failure('VALIDATION_ERROR', 'bookingId query parameter is required.'),
      );
    }

    const result = await this.staffAssignmentService.listAssignmentsForBooking(
      tenantId,
      bookingId,
    );
    return resultToResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a staff assignment by ID' })
  async retrieveAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.staffAssignmentService.getAssignmentById(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // EP1-STF-002 — Propose a staff assignment for a booking (pending confirmation)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Propose a staff assignment for a booking' })
  async createAssignment(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createStaffAssignmentSchema))
    body: CreateStaffAssignmentBody,
  ) {
    const result = await this.staffAssignmentService.createAssignment(
      tenantId,
      {
        bookingId: body.bookingId,
        staffMemberId: body.staffMemberId,
        role: body.role,
        isOnSiteLead: body.isOnSiteLead,
        reportingAt: body.reportingAt ? new Date(body.reportingAt) : undefined,
        note: body.note,
      },
    );

    return resultToResponse(result);
  }

  // EP1-AUT-004, EP1-AUT-001 — Human-confirmed staff assignment (no auto-assign)
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm a proposed staff assignment' })
  async confirmAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(confirmStaffAssignmentSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.staffAssignmentService.confirmAssignment(
      tenantId,
      id,
      version,
    );
    return resultToResponse(result);
  }

  // Release a confirmed assignment once the event is complete
  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release a confirmed staff assignment' })
  async releaseAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(releaseStaffAssignmentSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.staffAssignmentService.releaseAssignment(
      tenantId,
      id,
      version,
    );
    return resultToResponse(result);
  }

  // Withdraw a proposed or confirmed assignment
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a staff assignment' })
  async cancelAssignment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(cancelStaffAssignmentSchema))
    body: CancelStaffAssignmentBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.staffAssignmentService.cancelAssignment(
      tenantId,
      id,
      { reason: body.reason },
      version,
    );
    return resultToResponse(result);
  }
}
