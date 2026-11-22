import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { TimelineApplicationService } from '../application/services/timeline.application.service';
import {
  logTimelineEntrySchema,
  type LogTimelineEntryBody,
} from './schemas/timeline.schemas';

// Base path matches `docs/09-api-design.md` §Customer — Timeline.
// Nested under `/clients/:customerId/interactions` to avoid conflicting with Customer CRUD.
@ApiTags('Customer Timeline')
@ApiBearerAuth()
@Controller('clients/:customerId/interactions')
export class TimelineController {
  constructor(private readonly timelineService: TimelineApplicationService) {}

  // EP1-CUS-002 — List communication timeline for a customer (decision 4A)
  @Get()
  @Permissions('timeline:read')
  @ApiOperation({ summary: 'List customer timeline interactions' })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Timeline interactions listed')
  @ApiStandardErrors()
  async listInteractions(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    const result = await this.timelineService.listInteractions(
      tenantId,
      customerId,
    );
    return resultToResponse(result);
  }

  // EP1-CUS-002 — Append timeline entry (append-only; no If-Match)
  @Post()
  @Permissions('timeline:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a customer timeline interaction' })
  @ApiUuidParam('customerId')
  @ApiZodBody(logTimelineEntrySchema)
  @ApiDataResponse(201, 'Timeline interaction logged')
  @ApiStandardErrors()
  async logInteraction(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(logTimelineEntrySchema))
    body: LogTimelineEntryBody,
  ) {
    const result = await this.timelineService.logInteraction(
      tenantId,
      customerId,
      {
        eventId: body.eventId,
        type: body.type,
        message: body.message,
        occurredAt: new Date(body.occurredAt),
        recordedByUserId: user.userId,
      },
    );
    return resultToResponse(result);
  }
}
