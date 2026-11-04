import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { CustomerRepository } from '../../../customer/domain/repositories/customer.repository';
import { NotificationPreferenceRepository } from '../../domain/repositories/notification-preference.repository';
import {
  toNotificationPreferenceDto,
  type NotificationPreferenceDto,
} from '../dtos/notification-preference.dto';

export type UpsertNotificationPreferenceInput = {
  customerId: string;
  whatsapp?: boolean;
  email?: boolean;
  sms?: boolean;
};

@Injectable()
export class NotificationPreferenceApplicationService {
  constructor(
    private readonly preferenceRepository: NotificationPreferenceRepository,
    private readonly customerRepository: CustomerRepository,
  ) {}

  async upsertForCustomer(
    tenantId: string,
    input: UpsertNotificationPreferenceInput,
  ): Promise<Result<NotificationPreferenceDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      input.customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const preference = await this.preferenceRepository.upsertForCustomer(
      tenantId,
      {
        customerId: input.customerId,
        whatsapp: input.whatsapp,
        email: input.email,
        sms: input.sms,
      },
    );
    return success(toNotificationPreferenceDto(preference));
  }

  async getByCustomer(
    tenantId: string,
    customerId: string,
  ): Promise<Result<NotificationPreferenceDto>> {
    const customer = await this.customerRepository.findById(
      tenantId,
      customerId,
    );
    if (!customer) {
      return failure('NOT_FOUND', 'Customer not found.');
    }

    const preference = await this.preferenceRepository.findByCustomerId(
      tenantId,
      customerId,
    );
    if (!preference) {
      return failure('NOT_FOUND', 'Notification preference not found.');
    }
    return success(toNotificationPreferenceDto(preference));
  }
}
