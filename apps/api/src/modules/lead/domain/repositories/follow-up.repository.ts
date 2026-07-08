import type { FollowUpStatus } from '@prisma/client';

export type FollowUpRecord = {
  id: string;
  tenantId: string;
  leadId: string;
  dueAt: Date;
  notes: string | null;
  status: FollowUpStatus;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateFollowUpData = {
  leadId: string;
  dueAt: Date;
  notes?: string | null;
};

export abstract class FollowUpRepository {
  abstract create(
    tenantId: string,
    data: CreateFollowUpData,
  ): Promise<FollowUpRecord>;
}
