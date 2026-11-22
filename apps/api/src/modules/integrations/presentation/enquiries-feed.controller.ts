import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Permissions, Public } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
  OPENAPI_ERROR_ENVELOPE,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import {
  RATE_LIMIT_ENQUIRIES_FEED_PER_MINUTE,
  RATE_LIMIT_WINDOW_MS,
} from '../../../shared/throttling/rate-limits';
import { EnquiriesAdminApplicationService } from '../application/services/enquiries-admin.application.service';
import { EnquiriesSyncApplicationService } from '../application/services/enquiries-sync.application.service';
import { EnquiriesSignatureGuard } from './guards/enquiries-signature.guard';
import {
  backfillCheckSchema,
  deliveryIdSchema,
  enquiriesSyncSchema,
  type BackfillCheckBody,
  type EnquiriesSyncBody,
} from './schemas/enquiries-sync.schemas';

// M5-01 — Enquiries → EventOS booking feed (temporary bridge, ADR-019 phase 3).
@ApiTags('Integrations')
@Controller('integrations/enquiries')
export class EnquiriesFeedController {
  constructor(
    private readonly syncService: EnquiriesSyncApplicationService,
    private readonly adminService: EnquiriesAdminApplicationService,
  ) {}

  @Post('sync')
  @Public()
  @UseGuards(EnquiriesSignatureGuard)
  @Throttle({
    default: {
      limit: RATE_LIMIT_ENQUIRIES_FEED_PER_MINUTE,
      ttl: RATE_LIMIT_WINDOW_MS,
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive a booking delivery from the Enquiries app (HMAC-signed)',
    description:
      'Machine-to-machine endpoint (no user JWT). Authenticated by `X-EventOS-Signature: v1=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>` with `X-EventOS-Timestamp` (unix seconds, ±300 s) and `X-EventOS-Delivery-Id` (UUID, replay-protected for 24 h). The tenant comes from server config. Responds `200 { ok: true, eventId }`, `{ ok: true, ignored: "stale" | "not_approved_never_synced" }` or `{ ok: true, duplicate: true }`; 5xx means the sender should retry. Rate limited to 120/min.',
    security: [],
  })
  @ApiHeader({
    name: 'X-EventOS-Timestamp',
    required: true,
    description:
      'Unix seconds; deliveries more than 300 s from server time are rejected.',
  })
  @ApiHeader({
    name: 'X-EventOS-Signature',
    required: true,
    description: '`v1=<hex HMAC-SHA256(secret, timestamp + "." + rawBody)>`',
  })
  @ApiHeader({
    name: 'X-EventOS-Delivery-Id',
    required: true,
    description: 'UUID; a repeated id returns `{ ok: true, duplicate: true }`.',
  })
  @ApiZodBody(enquiriesSyncSchema)
  @ApiResponse({
    status: 200,
    description: 'Delivery accepted',
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            eventId: { type: 'string', format: 'uuid' },
          },
          required: ['ok', 'eventId'],
        },
        {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            ignored: {
              type: 'string',
              enum: ['stale', 'not_approved_never_synced'],
            },
          },
          required: ['ok', 'ignored'],
        },
        {
          type: 'object',
          properties: {
            ok: { type: 'boolean', example: true },
            duplicate: { type: 'boolean', example: true },
          },
          required: ['ok', 'duplicate'],
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Payload or delivery id failed validation (`VALIDATION_ERROR`)',
    schema: OPENAPI_ERROR_ENVELOPE,
  })
  @ApiResponse({
    status: 401,
    description: 'Missing, expired, or invalid signature (`INVALID_SIGNATURE`)',
    schema: OPENAPI_ERROR_ENVELOPE,
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limited (`RATE_LIMITED`)',
    schema: OPENAPI_ERROR_ENVELOPE,
  })
  async sync(
    @Headers('x-eventos-delivery-id') deliveryIdHeader: string | undefined,
    @Body(new ZodValidationPipe(enquiriesSyncSchema)) body: EnquiriesSyncBody,
  ) {
    const deliveryId = deliveryIdSchema.safeParse(deliveryIdHeader);
    if (!deliveryId.success) {
      return resultToResponse(
        failure('VALIDATION_ERROR', 'X-EventOS-Delivery-Id must be a UUID.'),
      );
    }

    const result = await this.syncService.sync(deliveryId.data, body);
    // Machine contract: the bare `{ ok, … }` object, not the `{ data }` envelope.
    return result.ok ? result.value : resultToResponse(result);
  }

  @Get('status')
  @Permissions('integrations:enquiries:manage')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Enquiries feed status (owner/admin)',
    description:
      'Last delivery time, delivery counts for the last 24 h (processed / stale / ignored / failed) and the last 20 errors. Backed by Redis: counts reset if Redis is flushed.',
  })
  @ApiDataResponse(200, 'Feed status retrieved')
  @ApiStandardErrors()
  async status() {
    return resultToResponse(await this.adminService.getStatus());
  }

  @Post('backfill-check')
  @Permissions('integrations:enquiries:manage')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reconcile a backfill list against synced enquiries (owner/admin)',
    description:
      'Accepts up to 1000 `{ enquiryId, sourceUpdatedAt }` pairs and returns which enquiries are `missing` from EventOS or `stale` (EventOS holds an older `sourceUpdatedAt`).',
  })
  @ApiZodBody(backfillCheckSchema)
  @ApiDataResponse(200, 'Backfill check completed')
  @ApiStandardErrors()
  async backfillCheck(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(backfillCheckSchema)) body: BackfillCheckBody,
  ) {
    return resultToResponse(
      await this.adminService.backfillCheck(tenantId, body.items),
    );
  }

  @Get('bookings/:bookingId/financials')
  @Permissions('integrations:financials:read')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Synced financial summary of an Enquiries booking (finance/owner)',
    description:
      'The `money` block received from Enquiries. Never part of the booking DTO; only roles holding `integrations:financials:read` (finance, owner, admin) can read it.',
  })
  @ApiUuidParam('bookingId')
  @ApiDataResponse(200, 'Synced financials retrieved')
  @ApiStandardErrors()
  async financials(
    @TenantId() tenantId: string,
    @Param('bookingId') bookingId: string,
  ) {
    return resultToResponse(
      await this.adminService.getSyncedFinancials(tenantId, bookingId),
    );
  }
}
