import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { CalendarController } from './presentation/calendar.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
