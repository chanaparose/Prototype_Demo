export function formatDate(
  dateInput: string | Date | null | undefined,
  format: string = 'dd/MM/yyyy'
): string {
  if (!dateInput) return '-';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';

  const formatter = new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formatter.format(date);
}

export function formatChatTime(isoString: string): string {
  if (!isoString) return '';

  const date = new Date(isoString);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatDeadline(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('th-TH', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatThaiDate(
  dateInput: string | Date | null | undefined
): string {
  if (!dateInput) return '-';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime()) ? date : null;
}

export function isOverdue(dateInput: string | Date | null | undefined): boolean {
  if (!dateInput) return false;

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;

  return date < new Date();
}

export function getDaysUntilDeadline(
  dateInput: string | Date | null | undefined
): number | null {
  if (!dateInput) return null;

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!(date instanceof Date) || isNaN(date.getTime())) return null;

  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
