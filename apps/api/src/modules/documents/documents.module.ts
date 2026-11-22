import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { DocumentController } from './presentation/document.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [DocumentController],
})
export class DocumentsModule {}
