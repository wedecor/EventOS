import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
import { EventChecklistApplicationService } from '../application/services/event-checklist.application.service';
import {
  generateEventChecklistsSchema,
  updateEventChecklistItemSchema,
  type GenerateEventChecklistsBody,
  type UpdateEventChecklistItemBody,
} from './schemas/checklist.schemas';

@ApiTags('Event Checklists')
@ApiBearerAuth()
@Controller('event-checklists')
export class EventChecklistController {
  constructor(
    private readonly eventChecklistService: EventChecklistApplicationService,
  ) {}

  @Get()
  @Permissions('checklists:read')
  @ApiOperation({ summary: 'List event checklists for a booking' })
  @ApiQuery({
    name: 'bookingId',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiDataResponse(200, 'Event checklists listed')
  @ApiStandardErrors()
  async list(
    @TenantId() tenantId: string,
    @Query('bookingId') bookingId: string | undefined,
  ) {
    if (!bookingId) {
      return resultToResponse(
        failure('VALIDATION_ERROR', 'bookingId query parameter is required.'),
      );
    }
    const result = await this.eventChecklistService.listForBooking(
      tenantId,
      bookingId,
    );
    return resultToResponse(result);
  }

  @Post('generate')
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate event checklists from active templates',
  })
  @ApiZodBody(generateEventChecklistsSchema)
  @ApiDataResponse(201, 'Event checklists generated')
  @ApiStandardErrors()
  async generate(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(generateEventChecklistsSchema))
    body: GenerateEventChecklistsBody,
  ) {
    const result = await this.eventChecklistService.generateFromTemplates(
      tenantId,
      body,
    );
    return resultToResponse(result);
  }

  @Get(':id')
  @Permissions('checklists:read')
  @ApiOperation({ summary: 'Get event checklist' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Event checklist retrieved')
  @ApiStandardErrors()
  async get(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.eventChecklistService.getById(tenantId, id);
    return resultToResponse(result);
  }

  @Patch(':id/items/:itemId')
  @Permissions('checklists:execute')
  @ApiOperation({ summary: 'Complete or undo an event checklist item' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateEventChecklistItemSchema)
  @ApiDataResponse(200, 'Event checklist item updated')
  @ApiStandardErrors()
  async updateItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateEventChecklistItemSchema))
    body: UpdateEventChecklistItemBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    const result = await this.eventChecklistService.updateItem(
      tenantId,
      id,
      itemId,
      {
        isCompleted: body.isCompleted,
        notes: body.notes,
        completedByUserId: user.userId,
      },
      version,
    );
    return resultToResponse(result);
  }
}
