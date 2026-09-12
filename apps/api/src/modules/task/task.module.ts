import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { TaskController } from './presentation/task.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [TaskController],
})
export class TaskModule {}
