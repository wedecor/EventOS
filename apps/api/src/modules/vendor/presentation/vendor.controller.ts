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
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { VendorApplicationService } from '../application/services/vendor.application.service';
import {
  addVendorIssueNoteSchema,
  createVendorSchema,
  listVendorsQuerySchema,
  updateVendorSchema,
  type AddVendorIssueNoteBody,
  type CreateVendorBody,
  type ListVendorsQuery,
  type UpdateVendorBody,
} from './schemas/vendor.schemas';

// Base path matches `docs/09-api-design.md` §Module: Vendor Procurement — Vendor master
// (`/api/v1/vendors`).
@ApiTags('Vendors')
@ApiBearerAuth()
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorApplicationService) {}

  // EP1-VEN-001 — List vendors
  @Get()
  @ApiOperation({ summary: 'List vendors' })
  async listVendors(
    @TenantId() tenantId: string,
    @Query(new ZodValidationPipe(listVendorsQuerySchema))
    query: ListVendorsQuery,
  ) {
    const result = await this.vendorService.listVendors(tenantId, {
      status: query.status,
      category: query.category,
    });
    return resultToResponse(result);
  }

  // EP1-VEN-001 — Create a vendor
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a vendor' })
  async createVendor(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createVendorSchema)) body: CreateVendorBody,
  ) {
    const result = await this.vendorService.createVendor(tenantId, body);
    return resultToResponse(result);
  }

  // EP1-VEN-001 — Retrieve a vendor by ID
  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a vendor by ID' })
  async retrieveVendor(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.vendorService.getVendorById(tenantId, id);
    return resultToResponse(result);
  }

  // EP1-VEN-001 — Update a vendor (status changes to paused/blocked require statusReason)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a vendor' })
  async updateVendor(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateVendorSchema)) body: UpdateVendorBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.vendorService.updateVendor(
      tenantId,
      id,
      body,
      version,
    );
    return resultToResponse(result);
  }

  // EP1-VEN-006 — Vendor-level issue/feedback note. Not enumerated in `docs/09-api-design.md`
  // §Module: Vendor Procurement REST Endpoints (only the procurement-line-level route is listed
  // there); added for parity with the documented `VendorIssueNote` entity (`07-domain-model.md`
  // §Vendor, `08-data-model.md` §Notes & Timeline Storage) — see implementation report doc drift.
  @Post(':id/issue-notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a vendor-level issue/feedback note' })
  async addIssueNote(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addVendorIssueNoteSchema))
    body: AddVendorIssueNoteBody,
  ) {
    const result = await this.vendorService.addIssueNote(tenantId, id, {
      message: body.message,
      severity: body.severity,
      occurredAt: body.occurredAt ? new Date(body.occurredAt) : undefined,
    });
    return resultToResponse(result);
  }
}
