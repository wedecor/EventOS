import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  ApiDataResponse,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { NotificationPreferenceApplicationService } from '../application/services/notification-preference.application.service';
import {
  upsertNotificationPreferenceSchema,
  type UpsertNotificationPreferenceBody,
} from './schemas/notification-preference.schemas';

@ApiTags('Notification Preferences')
@ApiBearerAuth()
@Controller('notification-preferences')
export class NotificationPreferenceController {
  constructor(
    private readonly preferenceService: NotificationPreferenceApplicationService,
  ) {}

  @Get()
  @Permissions('clients:read')
  @ApiOperation({ summary: 'Get notification preferences for a customer' })
  @ApiDataResponse(200, 'Notification preference retrieved')
  @ApiStandardErrors()
  async getByCustomer(
    @TenantId() tenantId: string,
    @Query('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.preferenceService.getByCustomer(tenantId, customerId),
    );
  }

  @Get('customers/:customerId')
  @Permissions('clients:read')
  @ApiOperation({
    summary: 'Get notification preferences for a customer by path',
  })
  @ApiUuidParam('customerId')
  @ApiDataResponse(200, 'Notification preference retrieved')
  @ApiStandardErrors()
  async getByCustomerPath(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    return resultToResponse(
      await this.preferenceService.getByCustomer(tenantId, customerId),
    );
  }

  @Put()
  @Permissions('clients:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upsert notification preferences for a customer' })
  @ApiZodBody(upsertNotificationPreferenceSchema)
  @ApiDataResponse(200, 'Notification preference upserted')
  @ApiStandardErrors()
  async upsert(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(upsertNotificationPreferenceSchema))
    body: UpsertNotificationPreferenceBody,
  ) {
    return resultToResponse(
      await this.preferenceService.upsertForCustomer(tenantId, body),
    );
  }
}
