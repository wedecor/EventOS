import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { VendorProcurementApplicationService } from '../application/services/vendor-procurement.application.service';

@ApiTags('Procurement Quotes')
@ApiBearerAuth()
@Controller('procurement-quotes')
export class ProcurementQuoteController {
  constructor(
    private readonly procurementService: VendorProcurementApplicationService,
  ) {}

  @Post(':id/approve')
  @Permissions('procurements:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a procurement quote (rejects siblings)' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiDataResponse(200, 'Quote approved')
  @ApiStandardErrors()
  async approve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number,
  ) {
    return resultToResponse(
      await this.procurementService.approveQuote(tenantId, id, version),
    );
  }
}
