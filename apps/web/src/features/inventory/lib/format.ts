import type {
  InventoryCondition,
  InventoryItemStatus,
  InventoryTaxonomy,
  MovementStatus,
} from '../schemas/inventory.schemas';

function titleCaseUnderscore(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatTaxonomy(value: InventoryTaxonomy | string): string {
  return titleCaseUnderscore(value);
}

export function formatCondition(value: InventoryCondition | string): string {
  return titleCaseUnderscore(value);
}

export function formatItemStatus(value: InventoryItemStatus | string): string {
  return titleCaseUnderscore(value);
}

export function formatMovementStatus(value: MovementStatus | string): string {
  return titleCaseUnderscore(value);
}

export function formatWhen(value: string | Date | null | undefined): string {
  if (value == null) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
