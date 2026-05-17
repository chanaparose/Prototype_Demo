export function formatDateTh(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** Calendar-day difference from now to `iso` (end of due date friendly). */
export function diffDaysFromNow(iso: string | undefined | null): number {
  if (!iso) return 999;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return 999;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(target);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}
