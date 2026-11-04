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
import { FinancialDocumentApplicationService } from '../application/services/financial-document.application.service';
import {
  createFinancialDocumentSchema,
  updateFinancialDocumentSchema,
  verifyFinancialDocumentSchema,
  type CreateFinancialDocumentBody,
  type UpdateFinancialDocumentBody,
  type VerifyFinancialDocumentBody,
} from './schemas/financial-document.schemas';

@ApiTags('Financial Documents')
@ApiBearerAuth()
@Controller('financial-documents')
export class FinancialDocumentController {
  constructor(
    private readonly documentService: FinancialDocumentApplicationService,
  ) {}

  @Get(':id')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'Retrieve a financial document by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Financial document retrieved')
  @ApiStandardErrors()
  async retrieve(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(await this.documentService.getById(tenantId, id));
  }

  @Get(':id/audit-events')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List audit events for a financial document' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Financial document audit events listed')
  @ApiStandardErrors()
  async listAudit(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.documentService.listAuditEvents(tenantId, id),
    );
  }

  @Post()
  @Permissions('documents:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Register financial document metadata (no binary upload; storageKey is metadata only)',
  })
  @ApiZodBody(createFinancialDocumentSchema)
  @ApiDataResponse(201, 'Financial document registered')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createFinancialDocumentSchema))
    body: CreateFinancialDocumentBody,
  ) {
    return resultToResponse(
      await this.documentService.createDocument(tenantId, {
        ...body,
        uploadedByUserId: user.userId,
      }),
    );
  }

  @Patch(':id')
  @Permissions('documents:write')
  @ApiOperation({ summary: 'Update financial document metadata' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateFinancialDocumentSchema)
  @ApiDataResponse(200, 'Financial document updated')
  @ApiStandardErrors()
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateFinancialDocumentSchema))
    body: UpdateFinancialDocumentBody,
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
      await this.documentService.updateDocument(
        tenantId,
        id,
        body,
        version,
        user.userId,
      ),
    );
  }

  @Post(':id/verify')
  @Permissions('documents:verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a financial document' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(verifyFinancialDocumentSchema)
  @ApiDataResponse(200, 'Financial document verified')
  @ApiStandardErrors()
  async verify(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(verifyFinancialDocumentSchema))
    body: VerifyFinancialDocumentBody,
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
      await this.documentService.verifyDocument(
        tenantId,
        id,
        {
          verificationNotes: body.verificationNotes,
          verifiedByUserId: user.userId,
        },
        version,
      ),
    );
  }

  @Post(':id/reject')
  @Permissions('documents:verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a financial document' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(verifyFinancialDocumentSchema)
  @ApiDataResponse(200, 'Financial document rejected')
  @ApiStandardErrors()
  async reject(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(verifyFinancialDocumentSchema))
    body: VerifyFinancialDocumentBody,
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
      await this.documentService.rejectDocument(
        tenantId,
        id,
        {
          verificationNotes: body.verificationNotes,
          verifiedByUserId: user.userId,
        },
        version,
      ),
    );
  }

  @Post(':id/delete')
  @Permissions('documents:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a financial document' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Financial document deleted')
  @ApiStandardErrors()
  async softDelete(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
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
      await this.documentService.softDeleteDocument(
        tenantId,
        id,
        version,
        user.userId,
      ),
    );
  }
}
