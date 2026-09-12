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
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
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

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an inventory movement by ID' })
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
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Plan an inventory movement for a booking' })
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
      },
    );

    return resultToResponse(result);
  }

  // EP1-INV-003, EP1-INV-005 — Transition movement state (Picked/Packed/Loaded/At Venue/Returned/Cleaned-Ready)
  @Post(':movementId/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition an inventory movement to a new state' })
  async transitionMovement(
    @TenantId() tenantId: string,
    @Param('movementId') movementId: string,
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
      },
      version,
    );

    return resultToResponse(result);
  }

  // EP1-INV-006 — Damage/loss accountability note
  @Post(':movementId/damage-notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a damage/loss note to an inventory movement' })
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
