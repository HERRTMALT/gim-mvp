import { addDays, addMonths, format, startOfMonth } from 'date-fns';
import { env } from '../config/env';

export function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: env.TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function dateOnly(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

export function plusDays(value: string, days: number): string {
  return dateOnly(addDays(new Date(`${value}T12:00:00`), days));
}

export function plusMonths(value: string, months: number): string {
  return dateOnly(addMonths(new Date(`${value}T12:00:00`), months));
}

export function firstDayOfMonth(): string {
  return dateOnly(startOfMonth(new Date(`${today()}T12:00:00`)));
}

export function toIso(value: string | null | undefined): string {
  if (!value) return '';
  if (value.includes('T')) return value;
  return `${value.replace(' ', 'T')}Z`;
}

export function displayDate(value: string | null | undefined): string {
  if (!value) return '—';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}
