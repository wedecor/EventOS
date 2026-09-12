import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { RepositoriesModule } from '../repositories.module';
import { CustomerController } from './presentation/customer.controller';

@Module({
  imports: [ApplicationServicesModule, RepositoriesModule],
  controllers: [CustomerController],
})
export class CustomerModule {}
