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
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
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
import { LeadApplicationService } from '../application/services/lead.application.service';
import {
  assignLeadSchema,
  changeLeadStageSchema,
  createFollowUpSchema,
  createLeadSchema,
  type AssignLeadBody,
  type ChangeLeadStageBody,
  type CreateFollowUpBody,
  type CreateLeadBody,
} from './schemas/lead.schemas';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadApplicationService) {}

  @Get()
  @Permissions('leads:read')
  @ApiOperation({ summary: 'List all leads for the tenant' })
  @ApiDataResponse(200, 'Leads listed')
  @ApiStandardErrors()
  async listLeads(@TenantId() tenantId: string) {
    const result = await this.leadService.listLeads(tenantId);
    return resultToResponse(result);
  }

  @Get(':id')
  @Permissions('leads:read')
  @ApiOperation({ summary: 'Get a lead by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Lead retrieved')
  @ApiStandardErrors()
  async getLeadById(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.leadService.getLeadById(tenantId, id);
    return resultToResponse(result);
  }

  @Post()
  @Permissions('leads:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiZodBody(createLeadSchema)
  @ApiDataResponse(201, 'Lead created')
  @ApiStandardErrors()
  async createLead(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createLeadSchema)) body: CreateLeadBody,
  ) {
    const result = await this.leadService.createLead(tenantId, {
      source: body.source,
      sourceDetail: body.sourceDetail,
      eventType: body.eventType,
      eventStartDate: body.eventDate?.start
        ? new Date(body.eventDate.start)
        : undefined,
      eventEndDate: body.eventDate?.end
        ? new Date(body.eventDate.end)
        : undefined,
      venue: body.venue,
      estimatedBudgetAmount: body.estimatedBudget?.amount,
      estimatedBudgetCurrency: body.estimatedBudget?.currency,
      guestCount: body.guestCount,
      notes: body.notes,
    });

    return resultToResponse(result);
  }

  @Patch(':id/stage')
  @Permissions('leads:stage:update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the stage of a lead' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(changeLeadStageSchema)
  @ApiDataResponse(200, 'Lead stage changed')
  @ApiStandardErrors()
  async changeLeadStage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(changeLeadStageSchema))
    body: ChangeLeadStageBody,
  ) {
    const result = await this.leadService.changeLeadStage(tenantId, id, {
      stage: body.stage,
      version: version ?? 0,
      lostReason: body.lostReason,
      reason: body.reason,
    });

    return resultToResponse(result);
  }

  @Post(':id/assign')
  @Permissions('leads:assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a lead to a staff member' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(assignLeadSchema)
  @ApiDataResponse(200, 'Lead assigned')
  @ApiStandardErrors()
  async assignLead(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(assignLeadSchema)) body: AssignLeadBody,
  ) {
    const result = await this.leadService.assignLead(tenantId, id, {
      assigneeId: body.staffId,
      version: version ?? 0,
    });

    return resultToResponse(result);
  }

  @Post(':id/follow-ups')
  @Permissions('leads:followups:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a follow-up for a lead' })
  @ApiUuidParam('id')
  @ApiZodBody(createFollowUpSchema)
  @ApiDataResponse(201, 'Follow-up scheduled')
  @ApiStandardErrors()
  async scheduleFollowUp(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createFollowUpSchema))
    body: CreateFollowUpBody,
  ) {
    const result = await this.leadService.scheduleFollowUp(tenantId, id, {
      dueAt: new Date(body.dueAt),
      notes: body.notes,
    });

    return resultToResponse(result);
  }
}
