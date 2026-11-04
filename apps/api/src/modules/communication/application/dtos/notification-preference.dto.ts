import type { NotificationPreferenceRecord } from '../../domain/repositories/notification-preference.repository';

export type NotificationPreferenceDto = {
  id: string;
  tenantId: string;
  customerId: string | null;
  userId: string | null;
  whatsapp: boolean;
  email: boolean;
  sms: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toNotificationPreferenceDto(
  record: NotificationPreferenceRecord,
): NotificationPreferenceDto {
  return { ...record };
}
