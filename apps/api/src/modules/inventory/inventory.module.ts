import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { InventoryDamageController } from './presentation/inventory-damage.controller';
import { InventoryItemController } from './presentation/inventory-item.controller';
import { InventoryMovementController } from './presentation/inventory-movement.controller';
import { InventoryReservationController } from './presentation/inventory-reservation.controller';
import { InventoryVerificationController } from './presentation/inventory-verification.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    InventoryItemController,
    InventoryMovementController,
    InventoryReservationController,
    InventoryVerificationController,
    InventoryDamageController,
  ],
})
export class InventoryModule {}
