import type { CustomerRecord } from '../../domain/repositories/customer.repository';

export type CustomerDto = {
  id: string;
  tenantId: string;
  displayName: string;
  type: CustomerRecord['type'];
  status: CustomerRecord['status'];
  primaryPhone: string | null;
  primaryEmail: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toCustomerDto(customer: CustomerRecord): CustomerDto {
  return { ...customer };
}
