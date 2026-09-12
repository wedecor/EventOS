import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../../auth/tenant.context';
import {
  parseIfMatchVersion,
  unwrapResult,
} from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CustomerApplicationService } from '../customer/application/services/customer.application.service';
import {
  addContactBodySchema,
  createClientBodySchema,
  updateClientBodySchema,
} from './schemas/client.schemas';

@ApiTags('Clients')
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly customerService: CustomerApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get()
  async listClients() {
    const data = unwrapResult(
      await this.customerService.listCustomers(this.tenantContext.getTenantId()),
    );
    return { data };
  }

  @Get(':id')
  async getClient(@Param('id') id: string) {
    const data = unwrapResult(
      await this.customerService.getCustomer(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Post()
  async createClient(
    @Body(new ZodValidationPipe(createClientBodySchema)) body: unknown,
  ) {
    const data = unwrapResult(
      await this.customerService.createCustomer(
        this.tenantContext.getTenantId(),
        body as Parameters<CustomerApplicationService['createCustomer']>[1],
      ),
    );
    return { data };
  }

  @Patch(':id')
  async updateClient(
    @Param('id') id: string,
    @Headers('if-match') ifMatch: string | undefined,
    @Body(new ZodValidationPipe(updateClientBodySchema)) body: unknown,
  ) {
    const version = parseIfMatchVersion(ifMatch);
    const data = unwrapResult(
      await this.customerService.updateCustomer(
        this.tenantContext.getTenantId(),
        id,
        body as Parameters<CustomerApplicationService['updateCustomer']>[2],
        version,
      ),
    );
    return { data };
  }

  @Post(':id/contacts')
  async addContact(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addContactBodySchema)) body: unknown,
  ) {
    const data = unwrapResult(
      await this.customerService.addContact(
        this.tenantContext.getTenantId(),
        id,
        body as Parameters<CustomerApplicationService['addContact']>[2],
      ),
    );
    return { data };
  }
}
