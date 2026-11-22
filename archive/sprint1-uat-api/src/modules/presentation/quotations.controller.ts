import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { TenantContext } from '../../auth/tenant.context';
import {
  parseIfMatchVersion,
  unwrapResult,
} from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { QuotationApplicationService } from '../quotation/application/services/quotation.application.service';
import {
  createQuotationBodySchema,
  lineItemBodySchema,
  updateLineItemBodySchema,
  updateQuotationBodySchema,
  versionBodySchema,
} from './schemas/quotation.schemas';

@ApiTags('Quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(
    private readonly quotationService: QuotationApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get(':id/line-items')
  async listLineItems(@Param('id') id: string) {
    const data = unwrapResult(
      await this.quotationService.listLineItems(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Get(':id/pdf')
  async getQuotationPdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = unwrapResult(
      await this.quotationService.generateQuotationPdf(
        this.tenantContext.getTenantId(),
        id,
      ),
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="quotation-${id}.pdf"`,
    );
    res.send(pdf);
  }

  @Get(':id')
  async getQuotation(@Param('id') id: string) {
    const data = unwrapResult(
      await this.quotationService.getQuotation(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Post()
  async createQuotation(
    @Body(new ZodValidationPipe(createQuotationBodySchema)) body: unknown,
  ) {
    const data = unwrapResult(
      await this.quotationService.createQuotation(
        this.tenantContext.getTenantId(),
        body as Parameters<QuotationApplicationService['createQuotation']>[1],
      ),
    );
    return { data };
  }

  @Patch(':id')
  async updateQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateQuotationBodySchema))
    body: { version: number; terms?: string | null; notes?: string | null },
  ) {
    const { version, ...patch } = body;
    const data = unwrapResult(
      await this.quotationService.updateQuotation(
        this.tenantContext.getTenantId(),
        id,
        patch,
        version,
      ),
    );
    return { data };
  }

  @Post(':id/line-items')
  async addLineItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(lineItemBodySchema)) body: unknown,
  ) {
    const data = unwrapResult(
      await this.quotationService.addLineItem(
        this.tenantContext.getTenantId(),
        id,
        body as Parameters<QuotationApplicationService['addLineItem']>[2],
      ),
    );
    return { data };
  }

  @Patch(':id/line-items/:itemId')
  async updateLineItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(updateLineItemBodySchema))
    body: { version: number } & Record<string, unknown>,
  ) {
    const { version, ...patch } = body;
    const data = unwrapResult(
      await this.quotationService.updateLineItem(
        this.tenantContext.getTenantId(),
        id,
        itemId,
        patch,
        version,
      ),
    );
    return { data };
  }

  @Delete(':id/line-items/:itemId')
  async removeLineItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Headers('if-match') ifMatch: string | undefined,
  ) {
    const version = parseIfMatchVersion(ifMatch);
    const data = unwrapResult(
      await this.quotationService.removeLineItem(
        this.tenantContext.getTenantId(),
        id,
        itemId,
        version,
      ),
    );
    return { data };
  }

  @Post(':id/send')
  async sendQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(versionBodySchema)) body: { version: number },
  ) {
    const data = unwrapResult(
      await this.quotationService.sendQuotation(
        this.tenantContext.getTenantId(),
        id,
        body.version,
      ),
    );
    return { data };
  }

  @Post(':id/approve')
  async approveQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(versionBodySchema)) body: { version: number },
  ) {
    const data = unwrapResult(
      await this.quotationService.approveQuotation(
        this.tenantContext.getTenantId(),
        id,
        body.version,
      ),
    );
    return { data };
  }

  @Post(':id/reject')
  async rejectQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(versionBodySchema)) body: { version: number },
  ) {
    const data = unwrapResult(
      await this.quotationService.rejectQuotation(
        this.tenantContext.getTenantId(),
        id,
        body.version,
      ),
    );
    return { data };
  }

  @Post(':id/revise')
  async reviseQuotation(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(versionBodySchema)) body: { version: number },
  ) {
    const data = unwrapResult(
      await this.quotationService.createNewRevision(
        this.tenantContext.getTenantId(),
        id,
        body.version,
      ),
    );
    return { data };
  }
}
