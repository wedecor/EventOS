import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { LeadApplicationService } from '../application/services/lead.application.service';
import {
  updateFollowUpSchema,
  type UpdateFollowUpBody,
} from './schemas/lead.schemas';

@ApiTags('Follow-ups')
@ApiBearerAuth()
@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly leadService: LeadApplicationService) {}

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a follow-up' })
  async updateFollowUp(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateFollowUpSchema))
    body: UpdateFollowUpBody,
  ) {
    const result = await this.leadService.updateFollowUp(
      tenantId,
      id,
      {
        status: body.status,
        dueAt: body.dueAt != null ? new Date(body.dueAt) : undefined,
        notes: body.comment,
      },
      version ?? 0,
    );

    return resultToResponse(result);
  }
}
