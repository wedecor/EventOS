import type { StaffAvailabilityKind } from '@prisma/client';

export type StaffAvailabilityRecord = {
  id: string;
  tenantId: string;
  staffMemberId: string;
  date: Date | null;
  weekday: number | null;
  startTime: string | null;
  endTime: string | null;
  kind: StaffAvailabilityKind;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export type CreateStaffAvailabilityData = {
  staffMemberId: string;
  date?: Date | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  kind: StaffAvailabilityKind;
  reason?: string | null;
  notes?: string | null;
};

export type UpdateStaffAvailabilityData = {
  date?: Date | null;
  weekday?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  kind?: StaffAvailabilityKind;
  reason?: string | null;
  notes?: string | null;
};

export abstract class StaffAvailabilityRepository {
  abstract create(
    tenantId: string,
    data: CreateStaffAvailabilityData,
  ): Promise<StaffAvailabilityRecord>;

  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<StaffAvailabilityRecord | null>;

  abstract findByStaffMemberId(
    tenantId: string,
    staffMemberId: string,
  ): Promise<StaffAvailabilityRecord[]>;

  abstract findForStaffInRange(
    tenantId: string,
    staffMemberId: string,
    from: Date,
    to: Date,
  ): Promise<StaffAvailabilityRecord[]>;

  abstract update(
    tenantId: string,
    id: string,
    data: UpdateStaffAvailabilityData,
    version: number,
  ): Promise<StaffAvailabilityRecord>;

  abstract remove(tenantId: string, id: string): Promise<void>;
}
