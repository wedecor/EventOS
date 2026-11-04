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
import { CommunicationApplicationService } from '../application/services/communication.application.service';
import {
  addCommunicationAttachmentSchema,
  createCommunicationSchema,
  transitionCommunicationSchema,
  updateCommunicationSchema,
  type AddCommunicationAttachmentBody,
  type CreateCommunicationBody,
  type TransitionCommunicationBody,
  type UpdateCommunicationBody,
} from './schemas/communication.schemas';

@ApiTags('Communications')
@ApiBearerAuth()
@Controller('communications')
export class CommunicationController {
  constructor(
    private readonly communicationService: CommunicationApplicationService,
  ) {}

  @Get()
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List all communications' })
  @ApiDataResponse(200, 'Communications listed')
  @ApiStandardErrors()
  async listAll(@TenantId() tenantId: string) {
    return resultToResponse(await this.communicationService.listAll(tenantId));
  }

  @Get(':id')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'Retrieve a communication by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Communication retrieved')
  @ApiStandardErrors()
  async retrieve(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.communicationService.getById(tenantId, id),
    );
  }

  @Get(':id/attachments')
  @Permissions('communications:read')
  @ApiOperation({ summary: 'List attachments for a communication' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Communication attachments listed')
  @ApiStandardErrors()
  async listAttachments(@TenantId() tenantId: string, @Param('id') id: string) {
    return resultToResponse(
      await this.communicationService.listAttachments(tenantId, id),
    );
  }

  @Post()
  @Permissions('communications:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a communication record (metadata only)' })
  @ApiZodBody(createCommunicationSchema)
  @ApiDataResponse(201, 'Communication created')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createCommunicationSchema))
    body: CreateCommunicationBody,
  ) {
    return resultToResponse(
      await this.communicationService.create(tenantId, {
        ...body,
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
        createdByUserId: user.userId,
      }),
    );
  }

  @Patch(':id')
  @Permissions('communications:write')
  @ApiOperation({ summary: 'Update communication metadata' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateCommunicationSchema)
  @ApiDataResponse(200, 'Communication updated')
  @ApiStandardErrors()
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateCommunicationSchema))
    body: UpdateCommunicationBody,
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
      await this.communicationService.updateMetadata(
        tenantId,
        id,
        body,
        version,
      ),
    );
  }

  @Post(':id/transition')
  @Permissions('communications:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transition communication status' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(transitionCommunicationSchema)
  @ApiDataResponse(200, 'Communication status transitioned')
  @ApiStandardErrors()
  async transition(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(transitionCommunicationSchema))
    body: TransitionCommunicationBody,
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
      await this.communicationService.transitionStatus(
        tenantId,
        id,
        body,
        version,
      ),
    );
  }

  @Post(':id/delete')
  @Permissions('communications:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a communication' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Communication deleted')
  @ApiStandardErrors()
  async softDelete(
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
      await this.communicationService.softDelete(tenantId, id, version),
    );
  }

  @Post(':id/attachments')
  @Permissions('communications:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Register communication attachment metadata (no binary upload; storageKey is metadata only)',
  })
  @ApiUuidParam('id')
  @ApiZodBody(addCommunicationAttachmentSchema)
  @ApiDataResponse(201, 'Communication attachment registered')
  @ApiStandardErrors()
  async addAttachment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addCommunicationAttachmentSchema))
    body: AddCommunicationAttachmentBody,
  ) {
    return resultToResponse(
      await this.communicationService.addAttachment(tenantId, id, body),
    );
  }

  @Post(':id/attachments/:attachmentId/delete')
  @Permissions('communications:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a communication attachment' })
  @ApiUuidParam('id')
  @ApiUuidParam('attachmentId')
  @ApiIfMatchHeader(true)
  @ApiDataResponse(200, 'Communication attachment deleted')
  @ApiStandardErrors()
  async softDeleteAttachment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
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
      await this.communicationService.softDeleteAttachment(
        tenantId,
        id,
        attachmentId,
        version,
      ),
    );
  }
}
