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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
  ApiZodQuery,
} from '../../../shared/presentation/openapi.helpers';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { StaffAvailabilityApplicationService } from '../application/services/staff-availability.application.service';
import {
  createStaffAvailabilitySchema,
  listStaffAvailabilityQuerySchema,
  updateStaffAvailabilitySchema,
  type CreateStaffAvailabilityBody,
  type ListStaffAvailabilityQuery,
  type UpdateStaffAvailabilityBody,
} from './schemas/staff-availability.schemas';

@ApiTags('Staff Availability')
@ApiBearerAuth()
@Controller('staff-availability')
export class StaffAvailabilityController {
  constructor(
    private readonly availabilityService: StaffAvailabilityApplicationService,
  ) {}

  @Get()
  @Permissions('staff:read')
  @ApiOperation({ summary: 'List availability for a staff member' })
  @ApiZodQuery(
    'staffMemberId',
    listStaffAvailabilityQuerySchema.shape.staffMemberId,
    { required: true },
  )
  @ApiDataResponse(200, 'Availability listed')
  @ApiStandardErrors()
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listStaffAvailabilityQuerySchema))
    query: ListStaffAvailabilityQuery,
  ) {
    const result = await this.availabilityService.listForStaff(
      tenantId,
      query.staffMemberId,
    );
    return resultToResponse(result);
  }

  @Post()
  @Permissions('staff:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create staff availability entry' })
  @ApiZodBody(createStaffAvailabilitySchema)
  @ApiDataResponse(201, 'Availability created')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createStaffAvailabilitySchema))
    body: CreateStaffAvailabilityBody,
  ) {
    const result = await this.availabilityService.create(tenantId, body);
    return resultToResponse(result);
  }

  @Patch(':id')
  @Permissions('staff:write')
  @ApiOperation({ summary: 'Update staff availability entry' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(updateStaffAvailabilitySchema)
  @ApiDataResponse(200, 'Availability updated')
  @ApiStandardErrors()
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number,
    @Body(new ZodValidationPipe(updateStaffAvailabilitySchema))
    body: UpdateStaffAvailabilityBody,
  ) {
    const result = await this.availabilityService.update(
      tenantId,
      id,
      body,
      version,
    );
    return resultToResponse(result);
  }

  @Delete(':id')
  @Permissions('staff:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete staff availability entry' })
  @ApiUuidParam('id')
  @ApiDataResponse(204, 'Availability deleted')
  @ApiStandardErrors()
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.availabilityService.remove(tenantId, id);
    if (!result.ok) {
      return resultToResponse(result);
    }
  }
}
