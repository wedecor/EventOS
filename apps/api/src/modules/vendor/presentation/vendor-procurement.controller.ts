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
import { VendorProcurementApplicationService } from '../application/services/vendor-procurement.application.service';
import {
  createProcurementQuoteSchema,
  createPurchaseOrderSchema,
  transitionProcurementWorkflowSchema,
  updateProcurementDeliverySchema,
  type CreateProcurementQuoteBody,
  type CreatePurchaseOrderBody,
  type TransitionProcurementWorkflowBody,
  type UpdateProcurementDeliveryBody,
} from './schemas/vendor-procurement.schemas';

@ApiTags('Vendor Procurements')
@ApiBearerAuth()
@Controller('vendor-procurements')
export class VendorProcurementController {
  constructor(
    private readonly procurementService: VendorProcurementApplicationService,
  ) {}

  @Get()
  @Permissions('procurements:read')
  @ApiOperation({ summary: 'List all vendor procurements for the tenant' })
  @ApiDataResponse(200, 'Procurements listed')
  @ApiStandardErrors()
  async listAll(@TenantId() tenantId: string) {
    return resultToResponse(await this.procurementService.listAll(tenantId));
  }

  @Get(':id')
  @Permissions('procurements:read')
  @ApiOperation({ summary: 'Retrieve vendor procurement detail' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Procurement retrieved')
  @ApiStandardErrors()
  async getById(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.procurementService.getById(tenantId, id),
    );
  }

  @Post(':id/transition')
  @Permissions('procurement:transition')
  @ApiOperation({ summary: 'Transition procurement workflow status' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(transitionProcurementWorkflowSchema)
  @ApiDataResponse(200, 'Procurement transitioned')
  @ApiStandardErrors()
  async transition(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number,
    @Body(new ZodValidationPipe(transitionProcurementWorkflowSchema))
    body: TransitionProcurementWorkflowBody,
  ) {
    return resultToResponse(
      await this.procurementService.transitionWorkflow(
        tenantId,
        id,
        body,
        version,
      ),
    );
  }

  @Post(':id/delivery')
  @Permissions('procurements:write')
  @ApiOperation({ summary: 'Update procurement delivery tracking' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(updateProcurementDeliverySchema)
  @ApiDataResponse(200, 'Delivery updated')
  @ApiStandardErrors()
  async updateDelivery(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number,
    @Body(new ZodValidationPipe(updateProcurementDeliverySchema))
    body: UpdateProcurementDeliveryBody,
  ) {
    return resultToResponse(
      await this.procurementService.updateDelivery(tenantId, id, body, version),
    );
  }

  @Get(':id/quotes')
  @Permissions('procurements:read')
  @ApiOperation({ summary: 'List quotes for a procurement' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Quotes listed')
  @ApiStandardErrors()
  async listQuotes(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.procurementService.listQuotes(tenantId, id),
    );
  }

  @Post(':id/quotes')
  @Permissions('procurements:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a vendor quotation to a procurement' })
  @ApiUuidParam('id')
  @ApiZodBody(createProcurementQuoteSchema)
  @ApiDataResponse(201, 'Quote created')
  @ApiStandardErrors()
  async createQuote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createProcurementQuoteSchema))
    body: CreateProcurementQuoteBody,
  ) {
    return resultToResponse(
      await this.procurementService.createQuote(tenantId, id, body),
    );
  }

  @Get(':id/purchase-orders')
  @Permissions('procurements:read')
  @ApiOperation({ summary: 'List purchase orders for a procurement' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Purchase orders listed')
  @ApiStandardErrors()
  async listPurchaseOrders(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.procurementService.listPurchaseOrders(tenantId, id),
    );
  }

  @Post(':id/purchase-orders')
  @Permissions('procurements:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a purchase order for a procurement' })
  @ApiUuidParam('id')
  @ApiZodBody(createPurchaseOrderSchema)
  @ApiDataResponse(201, 'Purchase order created')
  @ApiStandardErrors()
  async createPurchaseOrder(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createPurchaseOrderSchema))
    body: CreatePurchaseOrderBody,
  ) {
    return resultToResponse(
      await this.procurementService.createPurchaseOrder(tenantId, id, body),
    );
  }
}
