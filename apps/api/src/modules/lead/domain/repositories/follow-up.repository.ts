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

export type UpdateFollowUpData = {
  status?: FollowUpRecord['status'];
  dueAt?: Date | null;
  notes?: string | null;
};

export abstract class FollowUpRepository {
  abstract create(
    tenantId: string,
    data: CreateFollowUpData,
  ): Promise<FollowUpRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<FollowUpRecord | null>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateFollowUpData,
    version: number,
  ): Promise<FollowUpRecord>;
}
