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
import { VendorExpenseApplicationService } from '../application/services/vendor-expense.application.service';
import { voidExpenseSchema } from './schemas/vendor-expense.schemas';

// Base path matches `docs/09-api-design.md` §Module: Finance exactly (`/api/v1/expenses`) —
// distinct from the plural `bookings/:id/expenses` base used for recording (see `BookingController`),
// same pattern as `ProcurementController` vs `ProcurementLineController`.
@ApiTags('Finance')
@ApiBearerAuth()
@Controller('expenses')
export class ExpenseController {
  constructor(
    private readonly expenseService: VendorExpenseApplicationService,
  ) {}

  // EP1-FIN-004 — Void a vendor expense
  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Void a vendor expense' })
  async voidExpense(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(voidExpenseSchema)) _body: unknown,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.expenseService.voidExpense(tenantId, id, version);
    return resultToResponse(result);
  }
}
