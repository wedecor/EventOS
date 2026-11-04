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
import { CalendarApplicationService } from '../application/services/calendar.application.service';
import {
  calendarConflictsQuerySchema,
  calendarRangeQuerySchema,
  parseSources,
  type CalendarConflictsQuery,
  type CalendarRangeQuery,
} from './schemas/calendar.schemas';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarApplicationService) {}

  @Get()
  @Permissions('calendar:read')
  @ApiOperation({
    summary: 'Operations planning dashboard (aggregated read model)',
  })
  @ApiDataResponse(200, 'Planning dashboard')
  @ApiStandardErrors()
  async planning(@TenantId() tenantId: string) {
    return resultToResponse(
      await this.calendarService.getPlanningDashboard(tenantId),
    );
  }

  @Get('events')
  @Permissions('calendar:read')
  @ApiOperation({
    summary: 'Unified operations calendar entries (day / week / month)',
  })
  @ApiZodQuery('from', calendarRangeQuerySchema.shape.from, { required: true })
  @ApiZodQuery('to', calendarRangeQuerySchema.shape.to, { required: true })
  @ApiZodQuery('bookingId', calendarRangeQuerySchema.shape.bookingId, {
    required: false,
  })
  @ApiZodQuery('staffMemberId', calendarRangeQuerySchema.shape.staffMemberId, {
    required: false,
  })
  @ApiZodQuery('vendorId', calendarRangeQuerySchema.shape.vendorId, {
    required: false,
  })
  @ApiZodQuery('customerId', calendarRangeQuerySchema.shape.customerId, {
    required: false,
  })
  @ApiZodQuery(
    'inventoryItemId',
    calendarRangeQuerySchema.shape.inventoryItemId,
    { required: false },
  )
  @ApiZodQuery('eventType', calendarRangeQuerySchema.shape.eventType, {
    required: false,
  })
  @ApiZodQuery('status', calendarRangeQuerySchema.shape.status, {
    required: false,
  })
  @ApiZodQuery('sources', calendarRangeQuerySchema.shape.sources, {
    required: false,
  })
  @ApiDataResponse(200, 'Calendar events')
  @ApiStandardErrors()
  async events(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(calendarRangeQuerySchema))
    query: CalendarRangeQuery,
  ) {
    return resultToResponse(
      await this.calendarService.getEvents(tenantId, {
        ...query,
        sources: parseSources(query.sources),
      }),
    );
  }

  @Get('agenda')
  @Permissions('calendar:read')
  @ApiOperation({ summary: 'Agenda view of operational calendar entries' })
  @ApiZodQuery('from', calendarRangeQuerySchema.shape.from, { required: true })
  @ApiZodQuery('to', calendarRangeQuerySchema.shape.to, { required: true })
  @ApiZodQuery('bookingId', calendarRangeQuerySchema.shape.bookingId, {
    required: false,
  })
  @ApiZodQuery('staffMemberId', calendarRangeQuerySchema.shape.staffMemberId, {
    required: false,
  })
  @ApiZodQuery('vendorId', calendarRangeQuerySchema.shape.vendorId, {
    required: false,
  })
  @ApiZodQuery('customerId', calendarRangeQuerySchema.shape.customerId, {
    required: false,
  })
  @ApiZodQuery(
    'inventoryItemId',
    calendarRangeQuerySchema.shape.inventoryItemId,
    { required: false },
  )
  @ApiZodQuery('eventType', calendarRangeQuerySchema.shape.eventType, {
    required: false,
  })
  @ApiZodQuery('status', calendarRangeQuerySchema.shape.status, {
    required: false,
  })
  @ApiZodQuery('sources', calendarRangeQuerySchema.shape.sources, {
    required: false,
  })
  @ApiDataResponse(200, 'Agenda entries')
  @ApiStandardErrors()
  async agenda(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(calendarRangeQuerySchema))
    query: CalendarRangeQuery,
  ) {
    return resultToResponse(
      await this.calendarService.getAgenda(tenantId, {
        ...query,
        sources: parseSources(query.sources),
      }),
    );
  }

  @Get('timeline')
  @Permissions('calendar:read')
  @ApiOperation({
    summary: 'Chronological operational timeline (read-only aggregation)',
  })
  @ApiZodQuery('from', calendarRangeQuerySchema.shape.from, { required: true })
  @ApiZodQuery('to', calendarRangeQuerySchema.shape.to, { required: true })
  @ApiZodQuery('bookingId', calendarRangeQuerySchema.shape.bookingId, {
    required: false,
  })
  @ApiZodQuery('staffMemberId', calendarRangeQuerySchema.shape.staffMemberId, {
    required: false,
  })
  @ApiZodQuery('vendorId', calendarRangeQuerySchema.shape.vendorId, {
    required: false,
  })
  @ApiZodQuery('customerId', calendarRangeQuerySchema.shape.customerId, {
    required: false,
  })
  @ApiZodQuery(
    'inventoryItemId',
    calendarRangeQuerySchema.shape.inventoryItemId,
    { required: false },
  )
  @ApiZodQuery('eventType', calendarRangeQuerySchema.shape.eventType, {
    required: false,
  })
  @ApiZodQuery('status', calendarRangeQuerySchema.shape.status, {
    required: false,
  })
  @ApiZodQuery('sources', calendarRangeQuerySchema.shape.sources, {
    required: false,
  })
  @ApiDataResponse(200, 'Timeline entries')
  @ApiStandardErrors()
  async timeline(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(calendarRangeQuerySchema))
    query: CalendarRangeQuery,
  ) {
    return resultToResponse(
      await this.calendarService.getTimeline(tenantId, {
        ...query,
        sources: parseSources(query.sources),
      }),
    );
  }

  @Get('conflicts')
  @Permissions('calendar:read')
  @ApiOperation({
    summary:
      'Cross-module conflict visibility (display-only; reuses module logic)',
  })
  @ApiZodQuery('from', calendarConflictsQuerySchema.shape.from, {
    required: true,
  })
  @ApiZodQuery('to', calendarConflictsQuerySchema.shape.to, { required: true })
  @ApiZodQuery('bookingId', calendarConflictsQuerySchema.shape.bookingId, {
    required: false,
  })
  @ApiDataResponse(200, 'Conflict overlay')
  @ApiStandardErrors()
  async conflicts(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(calendarConflictsQuerySchema))
    query: CalendarConflictsQuery,
  ) {
    return resultToResponse(
      await this.calendarService.getConflicts(tenantId, query),
    );
  }
}
