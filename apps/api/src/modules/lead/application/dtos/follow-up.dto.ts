import type { FollowUpRecord } from '../../domain/repositories/follow-up.repository';

export type FollowUpDto = {
  id: string;
  tenantId: string;
  leadId: string;
  dueAt: Date;
  notes: string | null;
  status: FollowUpRecord['status'];
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export function toFollowUpDto(followUp: FollowUpRecord): FollowUpDto {
  return { ...followUp };
}
