import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { z } from 'zod';
import {
  CurrentUser,
  Permissions,
  type AuthenticatedUser,
} from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { StoredDocumentApplicationService } from '../application/services/stored-document.application.service';

const listQuerySchema = z
  .object({
    customerId: z.string().uuid().optional(),
    quotationId: z.string().uuid().optional(),
    bookingId: z.string().uuid().optional(),
    invoiceId: z.string().uuid().optional(),
  })
  .refine(
    (value) =>
      Boolean(
        value.customerId ||
          value.quotationId ||
          value.bookingId ||
          value.invoiceId,
      ),
    { message: 'At least one filter id is required' },
  );

const uploadFieldsSchema = z.object({
  category: z.enum([
    'quotation_pdf',
    'invoice_pdf',
    'customer_document',
    'event_image',
    'contract',
    'other',
  ]),
  customerId: z.string().uuid().optional(),
  quotationId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  invoiceId: z.string().uuid().optional(),
});

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentController {
  constructor(
    private readonly documentService: StoredDocumentApplicationService,
  ) {}

  @Post()
  @Permissions('documents:write')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'category'],
      properties: {
        file: { type: 'string', format: 'binary' },
        category: { type: 'string' },
        customerId: { type: 'string', format: 'uuid' },
        quotationId: { type: 'string', format: 'uuid' },
        bookingId: { type: 'string', format: 'uuid' },
        invoiceId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload an operational document' })
  @ApiDataResponse(201, 'Document uploaded')
  @ApiStandardErrors()
  async upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: Request,
  ) {
    if (!file) {
      return resultToResponse(failure('VALIDATION_ERROR', 'File is required.'));
    }

    const body = (req.body ?? {}) as Record<string, string>;
    const parsed = uploadFieldsSchema.safeParse({
      category: body.category,
      customerId: body.customerId || undefined,
      quotationId: body.quotationId || undefined,
      bookingId: body.bookingId || undefined,
      invoiceId: body.invoiceId || undefined,
    });
    if (!parsed.success) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          parsed.error.issues[0]?.message ?? 'Invalid upload fields.',
        ),
      );
    }

    const result = await this.documentService.upload(tenantId, {
      category: parsed.data.category,
      originalName: file.originalname,
      mimeType: file.mimetype,
      buffer: file.buffer,
      customerId: parsed.data.customerId,
      quotationId: parsed.data.quotationId,
      bookingId: parsed.data.bookingId,
      invoiceId: parsed.data.invoiceId,
      uploadedByUserId: user.userId,
    });
    return resultToResponse(result);
  }

  @Get()
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List operational documents for a linked record' })
  @ApiDataResponse(200, 'Documents listed')
  @ApiStandardErrors()
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listQuerySchema))
    query: z.infer<typeof listQuerySchema>,
  ) {
    const result = await this.documentService.list(tenantId, query);
    return resultToResponse(result);
  }

  @Get(':id/download')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'Download an operational document' })
  @ApiUuidParam('id')
  @ApiProduces('application/octet-stream')
  @ApiStandardErrors()
  async download(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<StreamableFile> {
    const result = await this.documentService.download(tenantId, id);
    const file = resultToResponse(result).data;
    return new StreamableFile(file.buffer, {
      type: file.mimeType,
      disposition: `attachment; filename="${file.fileName.replace(/"/g, '')}"`,
    });
  }

  @Delete(':id')
  @Permissions('documents:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete an operational document and remove blob',
  })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Document deleted')
  @ApiStandardErrors()
  async remove(
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
    const result = await this.documentService.delete(
      tenantId,
      id,
      version,
      user.userId,
    );
    return resultToResponse(result);
  }
}
