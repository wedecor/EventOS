import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { StaffAssignmentController } from './presentation/staff-assignment.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [StaffAssignmentController],
})
export class StaffModule {}
