import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { ProcurementController } from './presentation/procurement.controller';
import { ProcurementLineController } from './presentation/procurement-line.controller';
import { VendorController } from './presentation/vendor.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    VendorController,
    ProcurementController,
    ProcurementLineController,
  ],
})
export class VendorModule {}
