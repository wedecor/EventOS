import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { CustomerIntelligenceApplicationService } from '../application/services/customer-intelligence.application.service';

const timelineQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  /** Comma-separated timeline source values */
  sources: z.string().optional(),
});

type TimelineQuery = z.infer<typeof timelineQuerySchema>;

@ApiTags('Customer Intelligence')
@ApiBearerAuth()
@Controller('clients/:customerId')
export class CustomerIntelligenceController {
  constructor(
    private readonly intelligenceService: CustomerIntelligenceApplicationService,
  ) {}

  @Get('overview')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Customer 360 overview (read-only aggregation)' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Customer overview')
  @ApiStandardErrors()
  async overview(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.intelligenceService.getOverview(tenantId, customerId),
    );
  }

  @Get('timeline')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Unified customer relationship timeline' })
  @ApiUuidParam('customerId')
  @ApiZodQuery('from', timelineQuerySchema.shape.from, { required: false })
  @ApiZodQuery('to', timelineQuerySchema.shape.to, { required: false })
  @ApiZodQuery('sources', timelineQuerySchema.shape.sources, {
    required: false,
  })
  @ApiDataResponse(200, 'Customer timeline')
  @ApiStandardErrors()
  async timeline(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Query(new ZodValidationPipe(timelineQuerySchema)) query: TimelineQuery,
  ) {
    const sources = query.sources
      ? query.sources
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    return resultToResponse(
      await this.intelligenceService.getTimeline(tenantId, customerId, {
        from: query.from,
        to: query.to,
        sources,
      }),
    );
  }

  @Get('bookings')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Customer booking history' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Customer bookings')
  @ApiStandardErrors()
  async bookings(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.intelligenceService.getBookings(tenantId, customerId),
    );
  }

  @Get('relationship')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Customer relationship intelligence indicators' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Customer relationship')
  @ApiStandardErrors()
  async relationship(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.intelligenceService.getRelationship(tenantId, customerId),
    );
  }

  @Get('financial-summary')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Customer financial summary (read-only)' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Customer financial summary')
  @ApiStandardErrors()
  async financialSummary(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.intelligenceService.getFinancialSummary(tenantId, customerId),
    );
  }

  @Get('communications')
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Customer communication intelligence summary' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Customer communications summary')
  @ApiStandardErrors()
  async communications(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.intelligenceService.getCommunications(tenantId, customerId),
    );
  }
}
