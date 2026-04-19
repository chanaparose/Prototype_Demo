/** คำนวณจำนวนวันจากวันนี้ถึง deadline (ตัดเป็น calendar day แบบ local) */
export function daysUntilDeadline(deadlineIso: string | null | undefined): number | null {
  if (!deadlineIso || !String(deadlineIso).trim()) return null;
  const s = String(deadlineIso).trim();
  const datePart = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  const end = new Date(datePart + 'T12:00:00');
  if (Number.isNaN(end.getTime())) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

export type DeadlineTone = 'ok' | 'soon' | 'urgent' | 'past';

export function deadlineTone(daysLeft: number | null): DeadlineTone {
  if (daysLeft === null) return 'ok';
  if (daysLeft < 0) return 'past';
  if (daysLeft < 3) return 'urgent';
  if (daysLeft <= 7) return 'soon';
  return 'ok';
}

/** เหลือกี่ชั่วโมงถึง deadline (ใช้เตือนก่อนปิดรับ 24 ชม.) */
export function hoursUntilDeadline(deadlineIso: string | null | undefined): number | null {
  if (!deadlineIso || !String(deadlineIso).trim()) return null;
  const s = String(deadlineIso).trim();
  let d: Date;
  if (s.includes('T')) {
    d = new Date(s);
  } else {
    d = new Date(s.slice(0, 10) + 'T23:59:59');
  }
  if (Number.isNaN(d.getTime())) return null;
  return (d.getTime() - Date.now()) / (3600 * 1000);
}

export function formatThaiDeadlineShort(deadlineIso: string | null | undefined): string {
  if (!deadlineIso || !String(deadlineIso).trim()) return '';
  const s = String(deadlineIso).trim();
  const datePart = s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
  const d = new Date(datePart + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}
