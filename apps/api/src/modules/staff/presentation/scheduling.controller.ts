import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { SchedulingApplicationService } from '../application/services/scheduling.application.service';
import {
  schedulingCalendarQuerySchema,
  schedulingConflictsQuerySchema,
  schedulingRecommendationsQuerySchema,
  schedulingWorkloadQuerySchema,
  type SchedulingCalendarQuery,
  type SchedulingConflictsQuery,
  type SchedulingRecommendationsQuery,
  type SchedulingWorkloadQuery,
} from './schemas/scheduling.schemas';

@ApiTags('Scheduling')
@ApiBearerAuth()
@Controller('scheduling')
export class SchedulingController {
  constructor(
    private readonly schedulingService: SchedulingApplicationService,
  ) {}

  @Get('calendar')
  @Permissions('staff:read')
  @ApiOperation({
    summary: 'Staff scheduling calendar (day / week / month range)',
  })
  @ApiZodQuery('from', schedulingCalendarQuerySchema.shape.from, {
    required: true,
  })
  @ApiZodQuery('to', schedulingCalendarQuerySchema.shape.to, { required: true })
  @ApiZodQuery(
    'staffMemberId',
    schedulingCalendarQuerySchema.shape.staffMemberId,
    { required: false },
  )
  @ApiZodQuery('view', schedulingCalendarQuerySchema.shape.view, {
    required: false,
  })
  @ApiDataResponse(200, 'Calendar entries')
  @ApiStandardErrors()
  async calendar(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(schedulingCalendarQuerySchema))
    query: SchedulingCalendarQuery,
  ) {
    const result = await this.schedulingService.getCalendar(
      tenantId,
      query.from,
      query.to,
      query.staffMemberId,
    );
    return resultToResponse(result);
  }

  @Get('workload')
  @Permissions('staff:read')
  @ApiOperation({ summary: 'Staff workload summary metrics' })
  @ApiZodQuery(
    'staffMemberId',
    schedulingWorkloadQuerySchema.shape.staffMemberId,
    { required: false },
  )
  @ApiDataResponse(200, 'Workload summary')
  @ApiStandardErrors()
  async workload(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(schedulingWorkloadQuerySchema))
    query: SchedulingWorkloadQuery,
  ) {
    const result = await this.schedulingService.getWorkload(
      tenantId,
      query.staffMemberId,
    );
    return resultToResponse(result);
  }

  @Get('conflicts')
  @Permissions('staff:read')
  @ApiOperation({
    summary: 'Detect scheduling conflicts for a staff member on a booking',
  })
  @ApiZodQuery(
    'staffMemberId',
    schedulingConflictsQuerySchema.shape.staffMemberId,
    { required: true },
  )
  @ApiZodQuery('bookingId', schedulingConflictsQuerySchema.shape.bookingId, {
    required: true,
  })
  @ApiZodQuery(
    'excludeAssignmentId',
    schedulingConflictsQuerySchema.shape.excludeAssignmentId,
    { required: false },
  )
  @ApiDataResponse(200, 'Conflict list')
  @ApiStandardErrors()
  async conflicts(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(schedulingConflictsQuerySchema))
    query: SchedulingConflictsQuery,
  ) {
    const result =
      await this.schedulingService.detectConflictsForStaffOnBooking(
        tenantId,
        query.staffMemberId,
        query.bookingId,
        query.excludeAssignmentId,
      );
    return resultToResponse(result);
  }

  @Get('recommendations')
  @Permissions('staff:read')
  @ApiOperation({
    summary: 'Rule-based staff recommendations for a booking',
  })
  @ApiZodQuery(
    'bookingId',
    schedulingRecommendationsQuerySchema.shape.bookingId,
    { required: true },
  )
  @ApiDataResponse(200, 'Recommendations')
  @ApiStandardErrors()
  async recommendations(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(schedulingRecommendationsQuerySchema))
    query: SchedulingRecommendationsQuery,
  ) {
    const result = await this.schedulingService.recommendForBooking(
      tenantId,
      query.bookingId,
    );
    return resultToResponse(result);
  }
}
