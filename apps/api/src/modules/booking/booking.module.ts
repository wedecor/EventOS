import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { BookingController } from './presentation/booking.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [BookingController],
})
export class BookingModule {}
