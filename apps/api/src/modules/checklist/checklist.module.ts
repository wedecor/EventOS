import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { ChecklistTemplateController } from './presentation/checklist-template.controller';
import { EventChecklistController } from './presentation/event-checklist.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [ChecklistTemplateController, EventChecklistController],
})
export class ChecklistModule {}
