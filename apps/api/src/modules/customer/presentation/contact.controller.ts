import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import {
  toEmailString,
  toPhoneString,
} from '../../../shared/presentation/phone-email';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ContactApplicationService } from '../application/services/contact.application.service';
import {
  addContactSchema,
  type AddContactBody,
} from './schemas/contact.schemas';

// Base path matches `docs/09-api-design.md` §Customer — Add contact.
// Nested under `/clients/:customerId/contacts` (decision 6A: POST only).
@ApiTags('Customer Contacts')
@ApiBearerAuth()
@Controller('clients/:customerId/contacts')
export class ContactController {
  constructor(private readonly contactService: ContactApplicationService) {}

  // EP1-CUS-001 — Add owned Contact (docs/09 POST /clients/:id/contacts)
  @Post()
  @Permissions('clients:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a contact to a customer' })
  @ApiUuidParam('customerId')
  @ApiZodBody(addContactSchema)
  @ApiDataResponse(201, 'Contact added')
  @ApiStandardErrors()
  async addContact(
    @TenantId() tenantId: string,
    @Param('customerId') customerId: string,
    @Body(new ZodValidationPipe(addContactSchema)) body: AddContactBody,
  ) {
    const result = await this.contactService.addContact(tenantId, customerId, {
      name: body.name,
      role: body.role,
      phone: body.phone ? toPhoneString(body.phone) : null,
      email: body.email ? toEmailString(body.email) : null,
    });
    return resultToResponse(result);
  }
}
