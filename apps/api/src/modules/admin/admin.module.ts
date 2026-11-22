import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { SuggestionController } from './presentation/suggestion.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [SuggestionController],
})
export class AdminModule {}
