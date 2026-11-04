import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { FinancialDocumentApplicationService } from '../application/services/financial-document.application.service';

@ApiTags('Expense Documents')
@ApiBearerAuth()
@Controller('expense-documents')
export class ExpenseDocumentController {
  constructor(
    private readonly documentService: FinancialDocumentApplicationService,
  ) {}

  @Get(':expenseId')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List financial documents linked to an expense' })
  @ApiUuidParam('expenseId')
  @ApiDataResponse(200, 'Expense documents listed')
  @ApiStandardErrors()
  async listForExpense(
    @TenantId() tenantId: string,
    @Param('expenseId') expenseId: string,
  ) {
    return resultToResponse(
      await this.documentService.listForExpense(tenantId, expenseId),
    );
  }
}
