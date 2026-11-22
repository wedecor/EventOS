import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { CommunicationController } from './presentation/communication.controller';
import { CommunicationTemplateController } from './presentation/communication-template.controller';
import { NotificationPreferenceController } from './presentation/notification-preference.controller';
import { ReminderController } from './presentation/reminder.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    CommunicationController,
    CommunicationTemplateController,
    ReminderController,
    NotificationPreferenceController,
  ],
})
export class CommunicationModule {}
