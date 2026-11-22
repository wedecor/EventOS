import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { IntegrationSettingsApplicationService } from '../application/services/integration-settings.application.service';
import {
  testEmailSchema,
  updateIntegrationSettingsSchema,
  type TestEmailBody,
  type UpdateIntegrationSettingsBody,
} from './schemas/integration-settings.schemas';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations/settings')
export class IntegrationSettingsController {
  constructor(
    private readonly integrationSettingsService: IntegrationSettingsApplicationService,
  ) {}

  @Get()
  @Permissions('settings:read')
  @ApiOperation({ summary: 'Get integration settings (secrets masked)' })
  @ApiDataResponse(200, 'Integration settings retrieved')
  @ApiStandardErrors()
  async getSettings(@TenantId() tenantId: string) {
    return resultToResponse(
      await this.integrationSettingsService.getSettings(tenantId),
    );
  }

  @Patch()
  @Permissions('settings:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update integration settings (write-only secrets; never returned)',
  })
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateIntegrationSettingsSchema)
  @ApiDataResponse(200, 'Integration settings updated')
  @ApiStandardErrors()
  async updateSettings(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateIntegrationSettingsSchema))
    body: UpdateIntegrationSettingsBody,
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
      await this.integrationSettingsService.updateSettings(
        tenantId,
        body,
        version,
        user.userId,
      ),
    );
  }

  @Post('test-email')
  @Permissions('settings:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test email provider connection (acceptance ≠ delivery proof)',
  })
  @ApiZodBody(testEmailSchema)
  @ApiDataResponse(200, 'Email connection test result')
  @ApiStandardErrors()
  async testEmail(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(testEmailSchema)) body: TestEmailBody,
  ) {
    return resultToResponse(
      await this.integrationSettingsService.testEmail(
        tenantId,
        user.userId,
        body.to,
      ),
    );
  }

  @Post('test-storage')
  @Permissions('settings:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test storage provider with put/get/delete probe' })
  @ApiDataResponse(200, 'Storage connection test result')
  @ApiStandardErrors()
  async testStorage(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return resultToResponse(
      await this.integrationSettingsService.testStorage(tenantId, user.userId),
    );
  }
}
