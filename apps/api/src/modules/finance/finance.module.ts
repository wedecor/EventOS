import { Module } from '@nestjs/common';
import { ApplicationServicesModule } from '../application-services.module';
import { ExpenseController } from './presentation/expense.controller';
import { ExpenseDocumentController } from './presentation/expense-document.controller';
import { FinancialDocumentController } from './presentation/financial-document.controller';
import { InvoiceController } from './presentation/invoice.controller';
import { PaymentDocumentController } from './presentation/payment-document.controller';

@Module({
  imports: [ApplicationServicesModule],
  controllers: [
    InvoiceController,
    ExpenseController,
    FinancialDocumentController,
    PaymentDocumentController,
    ExpenseDocumentController,
  ],
})
export class FinanceModule {}
