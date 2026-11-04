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
import { failure } from '../../../shared/application/result';
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
import { InventoryReservationApplicationService } from '../application/services/inventory-reservation.application.service';
import {
  createInventoryReservationSchema,
  modifyInventoryReservationSchema,
  type CreateInventoryReservationBody,
  type ModifyInventoryReservationBody,
} from './schemas/inventory-reservation.schemas';

@ApiTags('Inventory Reservations')
@ApiBearerAuth()
@Controller('inventory-reservations')
export class InventoryReservationController {
  constructor(
    private readonly reservationService: InventoryReservationApplicationService,
  ) {}

  @Get(':id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Retrieve an inventory reservation by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Inventory reservation retrieved')
  @ApiStandardErrors()
  async retrieve(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.reservationService.getReservationById(tenantId, id),
    );
  }

  @Post()
  @Permissions('inventory:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reserve inventory for a booking' })
  @ApiZodBody(createInventoryReservationSchema)
  @ApiDataResponse(201, 'Inventory reserved')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createInventoryReservationSchema))
    body: CreateInventoryReservationBody,
  ) {
    return resultToResponse(
      await this.reservationService.createReservation(tenantId, body),
    );
  }

  @Patch(':id')
  @Permissions('inventory:write')
  @ApiOperation({ summary: 'Modify an active inventory reservation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(modifyInventoryReservationSchema)
  @ApiDataResponse(200, 'Inventory reservation modified')
  @ApiStandardErrors()
  async modify(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(modifyInventoryReservationSchema))
    body: ModifyInventoryReservationBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    return resultToResponse(
      await this.reservationService.modifyReservation(
        tenantId,
        id,
        body,
        version,
      ),
    );
  }

  @Post(':id/release')
  @Permissions('inventory:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release an inventory reservation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Inventory reservation released')
  @ApiStandardErrors()
  async release(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    return resultToResponse(
      await this.reservationService.releaseReservation(tenantId, id, version),
    );
  }

  @Post(':id/cancel')
  @Permissions('inventory:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel an inventory reservation' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Inventory reservation cancelled')
  @ApiStandardErrors()
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    return resultToResponse(
      await this.reservationService.cancelReservation(tenantId, id, version),
    );
  }
}
