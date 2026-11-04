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
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { InventoryDamageReportApplicationService } from '../application/services/inventory-damage-report.application.service';
import {
  createInventoryDamageReportSchema,
  type CreateInventoryDamageReportBody,
} from './schemas/inventory-damage.schemas';

@ApiTags('Inventory Damage')
@ApiBearerAuth()
@Controller('inventory-damage')
export class InventoryDamageController {
  constructor(
    private readonly damageReportService: InventoryDamageReportApplicationService,
  ) {}

  @Get('by-movement/:movementId')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List damage reports for an inventory movement' })
  @ApiUuidParam('movementId')
  @ApiDataResponse(200, 'Inventory damage reports listed')
  @ApiStandardErrors()
  async listForMovement(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
  ) {
    return resultToResponse(
      await this.damageReportService.listForMovement(tenantId, movementId),
    );
  }

  @Post(':movementId')
  @Permissions('inventory:damage-notes:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Record a structured damage report (photo metadata only; no image storage)',
  })
  @ApiUuidParam('movementId')
  @ApiZodBody(createInventoryDamageReportSchema)
  @ApiDataResponse(201, 'Inventory damage report recorded')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
    @Body(new ZodValidationPipe(createInventoryDamageReportSchema))
    body: CreateInventoryDamageReportBody,
  ) {
    return resultToResponse(
      await this.damageReportService.createDamageReport(
        tenantId,
        movementId,
        body,
      ),
    );
  }
}
