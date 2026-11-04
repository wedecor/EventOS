import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
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
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { TenantSettingsApplicationService } from '../application/services/tenant-settings.application.service';
import {
  updateTenantSettingsSchema,
  type UpdateTenantSettingsBody,
} from './schemas/tenant-settings.schemas';

// Base path matches `docs/09-api-design.md` §Module: Administration — Tenant settings
// (`/api/v1/settings`). Package lives under `modules/tenant/` per docs/10 + R3-04 decision 4A.
@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
export class TenantSettingsController {
  constructor(
    private readonly tenantSettingsService: TenantSettingsApplicationService,
  ) {}

  // EP1-KPI-007 — Read current tenant settings / KPI targets
  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get tenant settings' })
  @ApiDataResponse(200, 'Tenant settings retrieved')
  @ApiStandardErrors()
  async getSettings(@TenantId() tenantId: string) {
    const result = await this.tenantSettingsService.getSettings(tenantId);
    return resultToResponse(result);
  }

  // EP1-KPI-007 — Update tenant settings (If-Match required; decision 3A)
  @Patch()
  @Permissions('settings:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateTenantSettingsSchema)
  @ApiDataResponse(200, 'Tenant settings updated')
  @ApiStandardErrors()
  async updateSettings(
    @TenantId() tenantId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateTenantSettingsSchema))
    body: UpdateTenantSettingsBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.tenantSettingsService.updateSettings(
      tenantId,
      body,
      version,
    );
    return resultToResponse(result);
  }
}
