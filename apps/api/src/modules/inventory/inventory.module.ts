import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { InventoryMovementController } from './presentation/inventory-movement.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [InventoryMovementController],
})
export class InventoryModule {}
