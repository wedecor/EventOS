import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { InventoryApplicationService } from '../application/services/inventory.application.service';
import {
  createInventoryItemSchema,
  listInventoryItemsQuerySchema,
  updateInventoryItemSchema,
  type CreateInventoryItemBody,
  type ListInventoryItemsQuery,
  type UpdateInventoryItemBody,
} from './schemas/inventory-item.schemas';

// Base path matches `docs/09-api-design.md` §Module: Inventory — Inventory item master
// (`/api/v1/inventory/items`). No GET-by-id is documented for Phase 1.
@ApiTags('Inventory Items')
@ApiBearerAuth()
@Controller('inventory/items')
export class InventoryItemController {
  constructor(private readonly inventoryService: InventoryApplicationService) {}

  // EP1-INV-001 — List inventory items
  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List inventory items' })
  @ApiZodQuery('status', listInventoryItemsQuerySchema.shape.status, {
    required: false,
  })
  @ApiZodQuery('taxonomy', listInventoryItemsQuerySchema.shape.taxonomy, {
    required: false,
  })
  @ApiZodQuery('category', listInventoryItemsQuerySchema.shape.category, {
    required: false,
  })
  @ApiDataResponse(200, 'Inventory items listed')
  @ApiStandardErrors()
  async listItems(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listInventoryItemsQuerySchema))
    query: ListInventoryItemsQuery,
  ) {
    const result = await this.inventoryService.listItems(tenantId, {
      status: query.status,
      taxonomy: query.taxonomy,
      category: query.category,
    });
    return resultToResponse(result);
  }

  // EP1-INV-001 / EP1-INV-002 — Create an inventory item
  @Post()
  @Permissions('inventory:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an inventory item' })
  @ApiZodBody(createInventoryItemSchema)
  @ApiDataResponse(201, 'Inventory item created')
  @ApiStandardErrors()
  async createItem(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createInventoryItemSchema))
    body: CreateInventoryItemBody,
  ) {
    const result = await this.inventoryService.createItem(tenantId, body);
    return resultToResponse(result);
  }

  // EP1-INV-001 / EP1-INV-002 — Update an inventory item (If-Match required)
  @Patch(':id')
  @Permissions('inventory:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateInventoryItemSchema)
  @ApiDataResponse(200, 'Inventory item updated')
  @ApiStandardErrors()
  async updateItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateInventoryItemSchema))
    body: UpdateInventoryItemBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.inventoryService.updateItem(
      tenantId,
      id,
      body,
      version,
    );
    return resultToResponse(result);
  }
}
