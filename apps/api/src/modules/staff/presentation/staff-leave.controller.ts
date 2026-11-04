import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permissions } from '../../auth';
import type { AuthenticatedUser } from '../../auth/domain/authenticated-user';
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
import { StaffLeaveApplicationService } from '../application/services/staff-leave.application.service';
import {
  createStaffLeaveSchema,
  listStaffLeaveQuerySchema,
  reviewStaffLeaveSchema,
  type CreateStaffLeaveBody,
  type ListStaffLeaveQuery,
  type ReviewStaffLeaveBody,
} from './schemas/staff-leave.schemas';

@ApiTags('Staff Leave')
@ApiBearerAuth()
@Controller('staff-leave')
export class StaffLeaveController {
  constructor(private readonly leaveService: StaffLeaveApplicationService) {}

  @Get()
  @Permissions('staff:read')
  @ApiOperation({ summary: 'List leave requests for a staff member' })
  @ApiZodQuery('staffMemberId', listStaffLeaveQuerySchema.shape.staffMemberId, {
    required: true,
  })
  @ApiZodQuery('status', listStaffLeaveQuerySchema.shape.status, {
    required: false,
  })
  @ApiDataResponse(200, 'Leave listed')
  @ApiStandardErrors()
  async list(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listStaffLeaveQuerySchema))
    query: ListStaffLeaveQuery,
  ) {
    const result = await this.leaveService.listForStaff(
      tenantId,
      query.staffMemberId,
      query.status,
    );
    return resultToResponse(result);
  }

  @Post()
  @Permissions('staff:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request staff leave' })
  @ApiZodBody(createStaffLeaveSchema)
  @ApiDataResponse(201, 'Leave requested')
  @ApiStandardErrors()
  async create(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createStaffLeaveSchema))
    body: CreateStaffLeaveBody,
  ) {
    const result = await this.leaveService.create(tenantId, body);
    return resultToResponse(result);
  }

  @Post(':id/review')
  @Permissions('staff:write')
  @ApiOperation({ summary: 'Approve, reject, or cancel a leave request' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader()
  @ApiZodBody(reviewStaffLeaveSchema)
  @ApiDataResponse(200, 'Leave reviewed')
  @ApiStandardErrors()
  async review(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number,
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(reviewStaffLeaveSchema))
    body: ReviewStaffLeaveBody,
  ) {
    const result = await this.leaveService.review(
      tenantId,
      id,
      {
        status: body.status,
        reviewedByUserId: user.userId,
        notes: body.notes,
      },
      version,
    );
    return resultToResponse(result);
  }
}
