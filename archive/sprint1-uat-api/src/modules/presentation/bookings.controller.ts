import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantContext } from '../../auth/tenant.context';
import { unwrapResult } from '../../common/http/result-http';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BookingApplicationService } from '../booking/application/services/booking.application.service';
import { versionBodySchema } from './schemas/quotation.schemas';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingService: BookingApplicationService,
    private readonly tenantContext: TenantContext,
  ) {}

  @Get(':id')
  async getBooking(@Param('id') id: string) {
    const data = unwrapResult(
      await this.bookingService.retrieveBooking(
        this.tenantContext.getTenantId(),
        id,
      ),
    );
    return { data };
  }

  @Post('from-quotation/:quotationId')
  async createFromQuotation(@Param('quotationId') quotationId: string) {
    const data = unwrapResult(
      await this.bookingService.createEventFromApprovedQuotation(
        this.tenantContext.getTenantId(),
        quotationId,
      ),
    );
    return { data };
  }

  @Post(':id/activate')
  async activateBooking(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(versionBodySchema)) body: { version: number },
  ) {
    const data = unwrapResult(
      await this.bookingService.activateBooking(
        this.tenantContext.getTenantId(),
        id,
        { version: body.version },
      ),
    );
    return { data };
  }
}
