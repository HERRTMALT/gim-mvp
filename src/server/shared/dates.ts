import { addDays, addMonths, format, startOfMonth } from 'date-fns';
import { env } from '../config/env';

const FALLBACK_TIME_ZONE = 'America/Argentina/Buenos_Aires';

// Vercel expone `TZ=:UTC` (o valores no soportados por Intl), lo que rompe
// `Intl.DateTimeFormat`. Validamos una sola vez y caemos al default.
function resolveTimeZone(): string {
  const candidates = [env.APP_TZ, env.TZ, FALLBACK_TIME_ZONE];

  for (const candidate of candidates) {
    const value = candidate?.replace(/^:/, '').trim();
    if (!value) continue;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: value });
      return value;
    } catch {
      // Probamos el siguiente candidato.
    }
  }

  return FALLBACK_TIME_ZONE;
}

const TIME_ZONE = resolveTimeZone();

export function today(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
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
