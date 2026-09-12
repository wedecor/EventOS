import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ProcurementLineApplicationService } from '../application/services/procurement-line.application.service';
import {
  addProcurementLineSchema,
  type AddProcurementLineBody,
} from './schemas/procurement-line.schemas';

// Base path matches `docs/09-api-design.md` §7 `POST /api/v1/procurements/:id/lines` exactly.
@ApiTags('Vendor Procurement')
@ApiBearerAuth()
@Controller('procurements')
export class ProcurementController {
  constructor(
    private readonly procurementLineService: ProcurementLineApplicationService,
  ) {}

  // EP1-VEN-002 — Add a planned procurement line under a procurement header
  @Post(':id/lines')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a procurement line' })
  async addLine(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addProcurementLineSchema))
    body: AddProcurementLineBody,
  ) {
    const result = await this.procurementLineService.addLine(tenantId, id, {
      description: body.description,
      category: body.category,
      quantity: body.quantity,
      budgetedAmount: body.budgetedAmount,
      currency: body.currency,
      quotationLineItemId: body.quotationLineItemId,
      notes: body.notes,
    });

    return resultToResponse(result);
  }
}
