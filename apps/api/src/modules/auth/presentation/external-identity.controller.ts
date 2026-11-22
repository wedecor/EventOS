import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ExternalIdentityApplicationService } from '../application/services/external-identity.application.service';
import type { AuthenticatedUser } from '../domain/authenticated-user';
import { CurrentUser } from './decorators/current-user.decorator';
import { Permissions } from './decorators/permissions.decorator';
import {
  linkExternalIdentitySchema,
  type LinkExternalIdentityBody,
} from './schemas/external-identity.schemas';

// M5-01 — administrators link / unlink Firebase identities (owner/admin via
// `users:write`). TEMPORARY with the Firebase bridge (ADR-019 phase 3).
@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin/external-identities')
export class ExternalIdentityController {
  constructor(
    private readonly externalIdentityService: ExternalIdentityApplicationService,
  ) {}

  @Post()
  @Permissions('users:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Link an external (Firebase) identity to an EventOS user',
  })
  @ApiZodBody(linkExternalIdentitySchema)
  @ApiDataResponse(201, 'External identity linked')
  @ApiStandardErrors()
  async link(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(linkExternalIdentitySchema))
    body: LinkExternalIdentityBody,
  ) {
    return resultToResponse(
      await this.externalIdentityService.link(tenantId, user.userId, body),
    );
  }

  @Delete(':id')
  @Permissions('users:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unlink an external identity' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'External identity unlinked')
  @ApiStandardErrors()
  async unlink(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return resultToResponse(
      await this.externalIdentityService.unlink(tenantId, user.userId, id),
    );
  }
}
