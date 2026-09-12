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
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ProcurementLineApplicationService } from '../application/services/procurement-line.application.service';
import {
  addProcurementLineIssueNoteSchema,
  transitionProcurementLineSchema,
  type AddProcurementLineIssueNoteBody,
  type TransitionProcurementLineBody,
} from './schemas/procurement-line.schemas';

// Base path matches `docs/09-api-design.md` §8–9 exactly (`/api/v1/procurement/lines/:lineId/...`,
// singular "procurement" — distinct from the plural `procurements` base used for line creation).
@ApiTags('Vendor Procurement')
@ApiBearerAuth()
@Controller('procurement/lines')
export class ProcurementLineController {
  constructor(
    private readonly procurementLineService: ProcurementLineApplicationService,
  ) {}

  // EP1-VEN-003, EP1-VEN-005 — Transition a procurement line (with optional cost variance recording)
  @Post(':lineId/transition')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition a procurement line to a new state' })
  async transitionLine(
    @TenantId() tenantId: string,
    @Param('lineId') lineId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(transitionProcurementLineSchema))
    body: TransitionProcurementLineBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.procurementLineService.transitionLine(
      tenantId,
      lineId,
      {
        toStatus: body.toStatus,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
        notes: body.notes,
        actualAmount: body.actualAmount,
        costVarianceReason: body.costVarianceReason,
      },
      version,
    );

    return resultToResponse(result);
  }

  // EP1-VEN-006 — Procurement-line-level issue/feedback note
  @Post(':lineId/issue-notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add an issue note to a procurement line' })
  async addIssueNote(
    @TenantId() tenantId: string,
    @Param('lineId') lineId: string,
    @Body(new ZodValidationPipe(addProcurementLineIssueNoteSchema))
    body: AddProcurementLineIssueNoteBody,
  ) {
    const result = await this.procurementLineService.addIssueNote(
      tenantId,
      lineId,
      {
        message: body.message,
        severity: body.severity,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
      },
    );

    return resultToResponse(result);
  }
}
