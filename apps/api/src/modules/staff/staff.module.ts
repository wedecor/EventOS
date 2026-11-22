import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { StaffAssignmentController } from './presentation/staff-assignment.controller';
import { StaffController } from './presentation/staff.controller';
import { StaffAvailabilityController } from './presentation/staff-availability.controller';
import { StaffLeaveController } from './presentation/staff-leave.controller';
import { SchedulingController } from './presentation/scheduling.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    StaffController,
    StaffAssignmentController,
    StaffAvailabilityController,
    StaffLeaveController,
    SchedulingController,
  ],
})
export class StaffModule {}
