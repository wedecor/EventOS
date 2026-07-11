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
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { CustomerApplicationService } from '../application/services/customer.application.service';
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerBody,
  type UpdateCustomerBody,
} from './schemas/customer.schemas';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('clients')
export class CustomerController {
  constructor(private readonly customerService: CustomerApplicationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer' })
  async createCustomer(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createCustomerSchema)) body: CreateCustomerBody,
  ) {
    const result = await this.customerService.createCustomer(tenantId, {
      displayName: body.name,
      primaryEmail: body.email,
      primaryPhone: body.phone,
      notes: body.notes,
    });

    return resultToResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  async getCustomerById(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.customerService.getCustomerById(tenantId, id);
    return resultToResponse(result);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a customer' })
  async updateCustomer(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateCustomerSchema)) body: UpdateCustomerBody,
  ) {
    const result = await this.customerService.updateCustomer(
      tenantId,
      id,
      {
        displayName: body.name,
        primaryEmail: body.email,
        primaryPhone: body.phone,
        notes: body.notes,
      },
      version ?? 0,
    );

    return resultToResponse(result);
  }
}
