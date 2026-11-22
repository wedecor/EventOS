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
import { CommunicationTemplateApplicationService } from '../application/services/communication-template.application.service';
import {
  createCommunicationTemplateSchema,
  updateCommunicationTemplateSchema,
  type CreateCommunicationTemplateBody,
  type UpdateCommunicationTemplateBody,
} from './schemas/communication-template.schemas';

@ApiTags('Communication Templates')
@ApiBearerAuth()
@Controller('communication-templates')
export class CommunicationTemplateController {
  constructor(
    private readonly templateService: CommunicationTemplateApplicationService,
  ) {}

  @Get()
  @Permissions('communication-templates:read')
  @ApiOperation({ summary: 'List communication templates' })
  @ApiDataResponse(200, 'Communication templates listed')
  @ApiStandardErrors()
  async list(@TenantId() tenantId: string) {
    return resultToResponse(await this.templateService.list(tenantId));
  }

  @Get(':id')
  @Permissions('communication-templates:read')
  @ApiOperation({ summary: 'Retrieve a communication template by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Communication template retrieved')
  @ApiStandardErrors()
  async retrieve(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(await this.templateService.getById(tenantId, id));
  }

  @Post()
  @Permissions('communication-templates:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a communication template' })
  @ApiZodBody(createCommunicationTemplateSchema)
  @ApiDataResponse(201, 'Communication template created')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createCommunicationTemplateSchema))
    body: CreateCommunicationTemplateBody,
  ) {
    return resultToResponse(await this.templateService.create(tenantId, body));
  }

  @Patch(':id')
  @Permissions('communication-templates:write')
  @ApiOperation({ summary: 'Update a communication template' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateCommunicationTemplateSchema)
  @ApiDataResponse(200, 'Communication template updated')
  @ApiStandardErrors()
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateCommunicationTemplateSchema))
    body: UpdateCommunicationTemplateBody,
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
      await this.templateService.update(tenantId, id, body, version),
    );
  }

  @Post(':id/archive')
  @Permissions('communication-templates:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a communication template' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Communication template archived')
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
    return resultToResponse(
      await this.templateService.archive(tenantId, id, version),
    );
  }
}
