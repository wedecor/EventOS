import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
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
import { LeadIntelligenceApplicationService } from '../../ai/application/services/lead-intelligence.application.service';
import { CommunicationApplicationService } from '../../communication/application/services/communication.application.service';
import { PaymentApplicationService } from '../../payment/application/services/payment.application.service';
import { LeadApplicationService } from '../application/services/lead.application.service';
import {
  assignLeadSchema,
  changeLeadStageSchema,
  createFollowUpSchema,
  createLeadSchema,
  updateLeadSchema,
  type AssignLeadBody,
  type ChangeLeadStageBody,
  type CreateFollowUpBody,
  type CreateLeadBody,
  type UpdateLeadBody,
} from './schemas/lead.schemas';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadController {
  constructor(
    private readonly leadService: LeadApplicationService,
    private readonly paymentService: PaymentApplicationService,
    private readonly communicationService: CommunicationApplicationService,
    private readonly leadIntelligenceService: LeadIntelligenceApplicationService,
  ) {}

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

  @Patch(':id')
  @Permissions('leads:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update lead fields (non-stage)',
    description:
      'Updates mutable lead attributes. Stage changes use PATCH /leads/:id/stage. Terminal-stage leads cannot be updated. Requires If-Match version.',
  })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(updateLeadSchema)
  @ApiDataResponse(200, 'Lead updated')
  @ApiStandardErrors()
  async updateLead(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateLeadSchema)) body: UpdateLeadBody,
  ) {
    const result = await this.leadService.updateLead(
      tenantId,
      id,
      {
        customerId: body.customerId,
        sourceDetail: body.sourceDetail,
        eventType: body.eventType,
        eventStartDate: body.eventDate?.start
          ? new Date(body.eventDate.start)
          : body.eventDate === null
            ? null
            : undefined,
        eventEndDate: body.eventDate?.end
          ? new Date(body.eventDate.end)
          : body.eventDate === null
            ? null
            : undefined,
        venue: body.venue,
        estimatedBudgetAmount: body.estimatedBudget?.amount,
        estimatedBudgetCurrency: body.estimatedBudget?.currency,
        guestCount: body.guestCount,
        notes: body.notes,
      },
      version ?? 0,
      user.userId,
    );

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

  @Get(':id/follow-ups')
  @Permissions('leads:read')
  @ApiOperation({ summary: 'List follow-ups for a lead' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Follow-ups listed')
  @ApiStandardErrors()
  async listFollowUps(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.leadService.listFollowUpsForLead(tenantId, id);
    return resultToResponse(result);
  }

  @Get(':id/communications')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List communications for a lead' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Lead communications listed')
  @ApiStandardErrors()
  async listLeadCommunications(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.communicationService.listByLead(tenantId, id);
    return resultToResponse(result);
  }

  @Post(':id/ai/intelligence')
  @Permissions('leads:read', 'ai:use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate read-only Lead Intelligence (M4-AI.1)',
    description:
      'Analyzes authorized lead context and returns validated structured insights. Does not update the lead, create quotations, send email, or modify financial records.',
  })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Lead intelligence generated')
  @ApiStandardErrors()
  async generateLeadIntelligence(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Req() req: Request & { id?: string },
  ) {
    const requestId =
      typeof req.id === 'string'
        ? req.id
        : typeof req.headers['x-request-id'] === 'string'
          ? req.headers['x-request-id']
          : undefined;

    const result = await this.leadIntelligenceService.generate(
      tenantId,
      id,
      user.userId,
      requestId,
    );
    return resultToResponse(result);
  }

  @Get(':id/payments')
  @Permissions('payments:read')
  @ApiOperation({ summary: 'List payments recorded against a lead' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Lead payments listed')
  @ApiStandardErrors()
  async listLeadPayments(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.paymentService.listPaymentsForLead(tenantId, id);
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
