export { customersApi } from './api/customers.api';
export { CustomersHubPage } from './components/customers-hub-page';
export { CreateCustomerPage } from './components/create-customer-page';
export { CustomerDetailPage } from './components/customer-detail-page';
export { Customer360Page } from './components/customer-360-page';
export { EditCustomerPage } from './components/edit-customer-page';
export {
  useCustomerQuery,
  useCustomerOverviewQuery,
  useCustomerTimelineQuery,
  useCustomerBookingsQuery,
  useCustomerRelationshipQuery,
  useCustomerFinancialQuery,
  useCustomerCommunicationsQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  customerKeys,
} from './hooks/use-customer-queries';
