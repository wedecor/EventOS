import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../../auth/tenant.context';
import {
  parseIfMatchVersion,
  unwrapResult,
} from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LeadApplicationService } from '../lead/application/services/lead.application.service';
import { QuotationApplicationService } from '../quotation/application/services/quotation.application.service';
import type { CreateLeadInput } from '../lead/application/services/lead.application.service';
import {
  assignLeadBodySchema,
  changeLeadStageBodySchema,
  createLeadBodySchema,
  scheduleFollowUpBodySchema,
  updateLeadBodySchema,
} from './schemas/lead.schemas';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadService: LeadApplicationService,
    private readonly quotationService: QuotationApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get()
  async listLeads(@Query('include') include?: string) {
    const data = unwrapResult(
      await this.leadService.listLeads(this.tenantContext.getTenantId(), {
        includeCustomer: include === 'customer',
      }),
    );
    return { data };
  }

  @Get(':id/follow-ups')
  async listFollowUps(@Param('id') id: string) {
    const data = unwrapResult(
      await this.leadService.listFollowUpsForLead(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Get(':id/quotation')
  async getLatestQuotation(@Param('id') id: string) {
    const data = unwrapResult(
      await this.quotationService.findLatestByLeadId(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Get(':id')
  async getLead(@Param('id') id: string) {
    const data = unwrapResult(
      await this.leadService.getLead(this.tenantContext.getTenantId(), id),
    );
    return { data };
  }

  @Post()
  async createLead(
    @Body(new ZodValidationPipe(createLeadBodySchema))
    body: CreateLeadInput,
  ) {
    const data = unwrapResult(
      await this.leadService.createLead(this.tenantContext.getTenantId(), body),
    );
    return { data };
  }

  @Patch(':id')
  async updateLead(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body(new ZodValidationPipe(updateLeadBodySchema))
    body: Record<string, unknown>,
  ) {
    const version = parseIfMatchVersion(ifMatch);
    const data = unwrapResult(
      await this.leadService.updateLead(
        this.tenantContext.getTenantId(),
        id,
        body,
        version,
      ),
    );
    return { data };
  }

  @Patch(':id/stage')
  async changeStage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeLeadStageBodySchema))
    body: Parameters<LeadApplicationService['changeLeadStage']>[2],
  ) {
    const data = unwrapResult(
      await this.leadService.changeLeadStage(
        this.tenantContext.getTenantId(),
        id,
        body,
      ),
    );
    return { data };
  }

  @Post(':id/assign')
  async assignLead(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(assignLeadBodySchema))
    body: Parameters<LeadApplicationService['assignLead']>[2],
  ) {
    const data = unwrapResult(
      await this.leadService.assignLead(
        this.tenantContext.getTenantId(),
        id,
        body,
      ),
    );
    return { data };
  }

  @Post(':id/follow-ups')
  async scheduleFollowUp(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(scheduleFollowUpBodySchema))
    body: Parameters<LeadApplicationService['scheduleFollowUp']>[2],
  ) {
    const data = unwrapResult(
      await this.leadService.scheduleFollowUp(
        this.tenantContext.getTenantId(),
        id,
        body,
      ),
    );
    return { data };
  }
}
