import { format as formatDateFns, isValid, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

function parseDateInput(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isValid(dateInput) ? dateInput : null;
  const trimmed = String(dateInput).trim();
  if (!trimmed) return null;
  const fromIso = parseISO(trimmed);
  if (isValid(fromIso)) return fromIso;
  const fallback = new Date(trimmed);
  return isValid(fallback) ? fallback : null;
}

export function formatDate(
  dateInput: string | Date | null | undefined,
  pattern = 'dd/MM/yyyy',
): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';
  return formatDateFns(date, pattern, { locale: th });
}

export function formatIsoDate(dateInput: string | Date | null | undefined): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';
  return formatDateFns(date, 'yyyy-MM-dd');
}

export function formatDateTime(dateInput: string | Date | null | undefined): string {
  const date = parseDateInput(dateInput);
  if (!date) return '-';
  return formatDateFns(date, 'd MMM yyyy HH:mm', { locale: th });
}

export function formatDeadline(dateInput: string | Date | null | undefined): string {
  const date = parseDateInput(dateInput);
  if (!date) return '';
  return formatDateFns(date, 'd MMM', { locale: th });
}
