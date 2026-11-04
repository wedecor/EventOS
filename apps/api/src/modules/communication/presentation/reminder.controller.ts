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
import { Permissions } from '../../auth';
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
import { ReminderApplicationService } from '../application/services/reminder.application.service';
import {
  createReminderSchema,
  type CreateReminderBody,
} from './schemas/reminder.schemas';

@ApiTags('Reminders')
@ApiBearerAuth()
@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderApplicationService) {}

  @Get()
  @Permissions('reminders:read')
  @ApiOperation({ summary: 'List all reminders' })
  @ApiDataResponse(200, 'Reminders listed')
  @ApiStandardErrors()
  async listAll(@TenantId() tenantId: string) {
    return resultToResponse(await this.reminderService.listAll(tenantId));
  }

  @Get(':id')
  @Permissions('reminders:read')
  @ApiOperation({ summary: 'Retrieve a reminder by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Reminder retrieved')
  @ApiStandardErrors()
  async retrieve(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(await this.reminderService.getById(tenantId, id));
  }

  @Post()
  @Permissions('reminders:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a reminder' })
  @ApiZodBody(createReminderSchema)
  @ApiDataResponse(201, 'Reminder created')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createReminderSchema))
    body: CreateReminderBody,
  ) {
    return resultToResponse(
      await this.reminderService.create(tenantId, {
        ...body,
        dueAt: new Date(body.dueAt),
      }),
    );
  }

  @Post(':id/complete')
  @Permissions('reminders:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a reminder as completed' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Reminder completed')
  @ApiStandardErrors()
  async complete(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    return resultToResponse(
      await this.reminderService.complete(tenantId, id, version),
    );
  }

  @Post(':id/cancel')
  @Permissions('reminders:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a reminder' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Reminder cancelled')
  @ApiStandardErrors()
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    return resultToResponse(
      await this.reminderService.cancel(tenantId, id, version),
    );
  }
}
