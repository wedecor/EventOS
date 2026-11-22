import type { ChecklistTemplateRecord } from '../../domain/repositories/checklist-template.repository';
import type { ChecklistTemplateItemRecord } from '../../domain/repositories/checklist-template-item.repository';

export type ChecklistTemplateItemDto = ChecklistTemplateItemRecord;

export type ChecklistTemplateDto = ChecklistTemplateRecord & {
  items: ChecklistTemplateItemDto[];
};

export function toChecklistTemplateItemDto(
  record: ChecklistTemplateItemRecord,
): ChecklistTemplateItemDto {
  return { ...record };
}

export function toChecklistTemplateDto(
  record: ChecklistTemplateRecord,
  items: ChecklistTemplateItemRecord[] = [],
): ChecklistTemplateDto {
  return {
    ...record,
    items: items.map(toChecklistTemplateItemDto),
  };
}
