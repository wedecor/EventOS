import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { ExpenseController } from './presentation/expense.controller';
import { InvoiceController } from './presentation/invoice.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [InvoiceController, ExpenseController],
})
export class FinanceModule {}
