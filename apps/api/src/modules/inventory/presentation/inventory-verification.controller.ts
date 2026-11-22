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
import { CurrentUser, Permissions, type AuthenticatedUser } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { InventoryVerificationApplicationService } from '../application/services/inventory-verification.application.service';
import {
  createInventoryVerificationSchema,
  type CreateInventoryVerificationBody,
} from './schemas/inventory-verification.schemas';

@ApiTags('Inventory Verification')
@ApiBearerAuth()
@Controller('inventory-verification')
export class InventoryVerificationController {
  constructor(
    private readonly verificationService: InventoryVerificationApplicationService,
  ) {}

  @Get('by-movement/:movementId')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List verifications for an inventory movement' })
  @ApiUuidParam('movementId')
  @ApiDataResponse(200, 'Inventory verifications listed')
  @ApiStandardErrors()
  async listForMovement(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
  ) {
    return resultToResponse(
      await this.verificationService.listForMovement(tenantId, movementId),
    );
  }

  @Post(':movementId')
  @Permissions('inventory:move:confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record an inventory verification for a movement' })
  @ApiUuidParam('movementId')
  @ApiZodBody(createInventoryVerificationSchema)
  @ApiDataResponse(201, 'Inventory verification recorded')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createInventoryVerificationSchema))
    body: CreateInventoryVerificationBody,
  ) {
    return resultToResponse(
      await this.verificationService.createVerification(tenantId, movementId, {
        expectedQuantity: body.expectedQuantity,
        actualQuantity: body.actualQuantity,
        notes: body.notes,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : undefined,
        verifiedByUserId: user.userId,
      }),
    );
  }
}
