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
import { InventoryMovementApplicationService } from '../application/services/inventory-movement.application.service';
import {
  addDamageNoteSchema,
  createInventoryMovementSchema,
  transitionInventoryMovementSchema,
  type AddDamageNoteBody,
  type CreateInventoryMovementBody,
  type TransitionInventoryMovementBody,
} from './schemas/inventory-movement.schemas';

// Base path matches `docs/09-api-design.md` §Module: Inventory exactly (`/api/v1/inventory/movements`),
// which differs from the flat `?bookingId=` query convention used by Task/StaffAssignment.
@ApiTags('Inventory Movements')
@ApiBearerAuth()
@Controller('inventory/movements')
export class InventoryMovementController {
  constructor(
    private readonly inventoryMovementService: InventoryMovementApplicationService,
  ) {}

  @Get()
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'List all inventory movements for the tenant' })
  @ApiDataResponse(200, 'Inventory movements listed')
  @ApiStandardErrors()
  async listAll(@TenantId() tenantId: string) {
    return resultToResponse(
      await this.inventoryMovementService.listAllMovements(tenantId),
    );
  }

  @Get(':id')
  @Permissions('inventory:read')
  @ApiOperation({ summary: 'Retrieve an inventory movement by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Inventory movement retrieved')
  @ApiStandardErrors()
  async retrieveMovement(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.inventoryMovementService.getMovementById(
      tenantId,
      id,
    );
    return resultToResponse(result);
  }

  // EP1-INV-003 — Plan an inventory movement for a booking
  @Post()
  @Permissions('inventory:move:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Plan an inventory movement for a booking' })
  @ApiZodBody(createInventoryMovementSchema)
  @ApiDataResponse(201, 'Inventory movement planned')
  @ApiStandardErrors()
  async createMovement(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createInventoryMovementSchema))
    body: CreateInventoryMovementBody,
  ) {
    const result = await this.inventoryMovementService.createMovement(
      tenantId,
      {
        bookingId: body.bookingId,
        inventoryItemId: body.inventoryItemId,
        quantity: body.quantity,
        notes: body.notes,
        reservationId: body.reservationId,
      },
    );

    return resultToResponse(result);
  }

  // EP1-INV-003, EP1-INV-005 / P2-07 — Transition movement through packing/dispatch/return
  @Post(':movementId/transition')
  @Permissions('inventory:move:confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition an inventory movement to a new state' })
  @ApiUuidParam('movementId')
  @ApiIfMatchHeader(true)
  @ApiZodBody(transitionInventoryMovementSchema)
  @ApiDataResponse(200, 'Inventory movement transitioned')
  @ApiStandardErrors()
  async transitionMovement(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(transitionInventoryMovementSchema))
    body: TransitionInventoryMovementBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.inventoryMovementService.transitionMovement(
      tenantId,
      movementId,
      {
        toStatus: body.toStatus,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
        notes: body.notes,
        packedByUserId: body.packedByUserId ?? user.userId,
        verificationNotes: body.verificationNotes,
        vehicle: body.vehicle,
        driverName: body.driverName,
        returnedQuantity: body.returnedQuantity,
        missingQuantity: body.missingQuantity,
        damagedQuantity: body.damagedQuantity,
        returnVerificationNotes: body.returnVerificationNotes,
      },
      version,
    );

    return resultToResponse(result);
  }

  // EP1-INV-006 — Damage/loss accountability note
  @Post(':movementId/damage-notes')
  @Permissions('inventory:damage-notes:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a damage/loss note to an inventory movement' })
  @ApiUuidParam('movementId')
  @ApiZodBody(addDamageNoteSchema)
  @ApiDataResponse(201, 'Damage note added')
  @ApiStandardErrors()
  async addDamageNote(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
    @Body(new ZodValidationPipe(addDamageNoteSchema)) body: AddDamageNoteBody,
  ) {
    const result = await this.inventoryMovementService.addDamageNote(
      tenantId,
      movementId,
      {
        message: body.message,
        accountability: body.accountability,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      },
    );

    return resultToResponse(result);
  }
}
