import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { IssueApplicationService } from '../application/services/issue.application.service';
import {
  createIssueNoteSchema,
  type CreateIssueNoteBody,
} from './schemas/issue-note.schemas';

// docs/09 §Customer — POST /api/v1/events/:eventId/issues (R3-07 / EP1-CUS-004).
@ApiTags('Customer Issues')
@ApiBearerAuth()
@Controller('events/:eventId/issues')
export class IssueController {
  constructor(private readonly issueService: IssueApplicationService) {}

  @Post()
  @Permissions('issues:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a customer issue note for an event' })
  @ApiUuidParam('eventId')
  @ApiZodBody(createIssueNoteSchema)
  @ApiDataResponse(201, 'Issue note created')
  @ApiStandardErrors()
  async createIssueNote(
    @TenantId() tenantId: string,
    @Param('eventId') eventId: string,
    @Body(new ZodValidationPipe(createIssueNoteSchema))
    body: CreateIssueNoteBody,
  ) {
    const result = await this.issueService.createIssueNote(tenantId, eventId, {
      message: body.message,
      severity: body.severity,
      notes: body.notes,
    });
    return resultToResponse(result);
  }
}
