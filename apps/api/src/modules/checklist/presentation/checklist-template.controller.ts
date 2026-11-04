import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
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
import { ChecklistTemplateApplicationService } from '../application/services/checklist-template.application.service';
import {
  createChecklistTemplateItemSchema,
  createChecklistTemplateSchema,
  updateChecklistTemplateItemSchema,
  updateChecklistTemplateSchema,
  type CreateChecklistTemplateBody,
  type CreateChecklistTemplateItemBody,
  type UpdateChecklistTemplateBody,
  type UpdateChecklistTemplateItemBody,
} from './schemas/checklist.schemas';
import type { ChecklistTemplateStatus } from '@prisma/client';

@ApiTags('Checklist Templates')
@ApiBearerAuth()
@Controller('checklist-templates')
export class ChecklistTemplateController {
  constructor(
    private readonly templateService: ChecklistTemplateApplicationService,
  ) {}

  @Get()
  @Permissions('checklists:read')
  @ApiOperation({ summary: 'List checklist templates' })
  @ApiQuery({ name: 'status', required: false })
  @ApiDataResponse(200, 'Templates listed')
  @ApiStandardErrors()
  async list(
    @TenantId() tenantId: string,
    @Query('status') status?: ChecklistTemplateStatus,
  ) {
    const result = await this.templateService.listTemplates(tenantId, status);
    return resultToResponse(result);
  }

  @Get(':id')
  @Permissions('checklists:read')
  @ApiOperation({ summary: 'Get checklist template' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Template retrieved')
  @ApiStandardErrors()
  async get(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.templateService.getTemplate(tenantId, id);
    return resultToResponse(result);
  }

  @Get(':id/versions')
  @Permissions('checklists:read')
  @ApiOperation({ summary: 'List template version history' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Template versions listed')
  @ApiStandardErrors()
  async versions(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.templateService.listVersions(tenantId, id);
    return resultToResponse(result);
  }

  @Post()
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create checklist template' })
  @ApiZodBody(createChecklistTemplateSchema)
  @ApiDataResponse(201, 'Template created')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createChecklistTemplateSchema))
    body: CreateChecklistTemplateBody,
  ) {
    const result = await this.templateService.createTemplate(tenantId, body);
    return resultToResponse(result);
  }

  @Patch(':id')
  @Permissions('checklists:write')
  @ApiOperation({ summary: 'Update checklist template' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateChecklistTemplateSchema)
  @ApiDataResponse(200, 'Template updated')
  @ApiStandardErrors()
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateChecklistTemplateSchema))
    body: UpdateChecklistTemplateBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    const result = await this.templateService.updateTemplate(
      tenantId,
      id,
      body,
      version,
    );
    return resultToResponse(result);
  }

  @Post(':id/archive')
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive checklist template' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Template archived')
  @ApiStandardErrors()
  async archive(
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
    const result = await this.templateService.archiveTemplate(
      tenantId,
      id,
      version,
    );
    return resultToResponse(result);
  }

  @Post(':id/duplicate')
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate checklist template (new version)' })
  @ApiUuidParam('id')
  @ApiDataResponse(201, 'Template duplicated')
  @ApiStandardErrors()
  async duplicate(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.templateService.duplicateTemplate(tenantId, id);
    return resultToResponse(result);
  }

  @Post(':id/items')
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add template item' })
  @ApiUuidParam('id')
  @ApiZodBody(createChecklistTemplateItemSchema)
  @ApiDataResponse(201, 'Template item created')
  @ApiStandardErrors()
  async addItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createChecklistTemplateItemSchema))
    body: CreateChecklistTemplateItemBody,
  ) {
    const result = await this.templateService.addItem(tenantId, id, body);
    return resultToResponse(result);
  }

  @Patch(':id/items/:itemId')
  @Permissions('checklists:write')
  @ApiOperation({ summary: 'Update template item' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateChecklistTemplateItemSchema)
  @ApiDataResponse(200, 'Template item updated')
  @ApiStandardErrors()
  async updateItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateChecklistTemplateItemSchema))
    body: UpdateChecklistTemplateItemBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }
    const result = await this.templateService.updateItem(
      tenantId,
      id,
      itemId,
      body,
      version,
    );
    return resultToResponse(result);
  }

  @Delete(':id/items/:itemId')
  @Permissions('checklists:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove template item (unused templates only)' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiDataResponse(204, 'Template item removed')
  @ApiStandardErrors()
  async removeItem(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await this.templateService.removeItem(tenantId, id, itemId);
    if (!result.ok) {
      return resultToResponse(result);
    }
  }
}
