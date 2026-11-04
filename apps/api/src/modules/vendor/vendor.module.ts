import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { ProcurementController } from './presentation/procurement.controller';
import { ProcurementLineController } from './presentation/procurement-line.controller';
import { ProcurementQuoteController } from './presentation/procurement-quote.controller';
import { VendorController } from './presentation/vendor.controller';
import { VendorProcurementController } from './presentation/vendor-procurement.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    VendorController,
    ProcurementController,
    ProcurementLineController,
    VendorProcurementController,
    ProcurementQuoteController,
  ],
})
export class VendorModule {}
