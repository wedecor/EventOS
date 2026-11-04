import type { Money } from '@/features/dashboard/schemas/dashboard.schemas';

/** Format API money DTOs for display (amount is major units per backend MoneyDto). */
export function formatMoney(money: Money): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: money.currency || 'INR',
      maximumFractionDigits: 0,
    }).format(money.amount);
  } catch {
    return `${money.currency} ${money.amount}`;
  }
}

/** Backend conversion rates are 0–1 fractions. */
export function formatConversionRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatEventDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
