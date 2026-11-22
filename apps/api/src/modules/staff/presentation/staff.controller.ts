import {
  Body,
  Controller,
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
import { failure } from '../../../shared/application/result';
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
import { StaffApplicationService } from '../application/services/staff.application.service';
import {
  createStaffMemberSchema,
  listStaffMembersQuerySchema,
  toPhoneString,
  updateStaffMemberSchema,
  type CreateStaffMemberBody,
  type ListStaffMembersQuery,
  type UpdateStaffMemberBody,
} from './schemas/staff.schemas';

// Base path matches `docs/09-api-design.md` §Module: Staff Management (`/api/v1/staff`).
@ApiTags('Staff')
@ApiBearerAuth()
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffApplicationService) {}

  // EP1-STF-001 — List staff members
  @Get()
  @Permissions('staff:read')
  @ApiOperation({ summary: 'List staff members' })
  @ApiZodQuery('status', listStaffMembersQuerySchema.shape.status, {
    required: false,
  })
  @ApiDataResponse(200, 'Staff members listed')
  @ApiStandardErrors()
  async listStaffMembers(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listStaffMembersQuerySchema))
    query: ListStaffMembersQuery,
  ) {
    const result = await this.staffService.listStaffMembers(tenantId, {
      status: query.status,
    });
    return resultToResponse(result);
  }

  // EP1-STF-001 — Create a staff member
  @Post()
  @Permissions('staff:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a staff member' })
  @ApiZodBody(createStaffMemberSchema)
  @ApiDataResponse(201, 'Staff member created')
  @ApiStandardErrors()
  async createStaffMember(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createStaffMemberSchema))
    body: CreateStaffMemberBody,
  ) {
    const result = await this.staffService.createStaffMember(tenantId, {
      name: body.name,
      role: body.role,
      department: body.department,
      phone: toPhoneString(body.phone),
      email: body.email?.value ?? null,
      status: body.status,
      userId: body.userId,
      employmentType: body.employmentType,
      joinedAt:
        body.joinedAt === undefined
          ? undefined
          : body.joinedAt === null
            ? null
            : new Date(body.joinedAt),
    });
    return resultToResponse(result);
  }

  // EP1-STF-001 — Retrieve a staff member by ID
  @Get(':id')
  @Permissions('staff:read')
  @ApiOperation({ summary: 'Retrieve a staff member by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Staff member retrieved')
  @ApiStandardErrors()
  async retrieveStaffMember(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.staffService.getStaffMemberById(tenantId, id);
    return resultToResponse(result);
  }

  // EP1-STF-001 — Update a staff member (If-Match required; all mutable fields)
  @Patch(':id')
  @Permissions('staff:write')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a staff member' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateStaffMemberSchema)
  @ApiDataResponse(200, 'Staff member updated')
  @ApiStandardErrors()
  async updateStaffMember(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateStaffMemberSchema))
    body: UpdateStaffMemberBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.staffService.updateStaffMember(
      tenantId,
      id,
      {
        name: body.name,
        role: body.role,
        department: body.department,
        phone: body.phone ? toPhoneString(body.phone) : undefined,
        email:
          body.email === undefined
            ? undefined
            : body.email === null
              ? null
              : body.email.value,
        status: body.status,
        userId: body.userId,
        employmentType: body.employmentType,
        joinedAt:
          body.joinedAt === undefined
            ? undefined
            : body.joinedAt === null
              ? null
              : new Date(body.joinedAt),
      },
      version,
    );
    return resultToResponse(result);
  }
}
