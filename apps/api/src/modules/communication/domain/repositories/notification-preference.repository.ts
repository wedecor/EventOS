export type NotificationPreferenceRecord = {
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

export type UpsertNotificationPreferenceData = {
  customerId: string;
  whatsapp?: boolean;
  email?: boolean;
  sms?: boolean;
};

export abstract class NotificationPreferenceRepository {
  abstract findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<NotificationPreferenceRecord | null>;

  abstract upsertForCustomer(
    tenantId: string,
    data: UpsertNotificationPreferenceData,
  ): Promise<NotificationPreferenceRecord>;
}
