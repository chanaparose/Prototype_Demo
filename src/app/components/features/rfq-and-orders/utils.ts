import type { RfqFilterId } from '@/components/features/rfq-and-orders/constants';

export function formatBudget(n: number): string {
  return '฿' + n.toLocaleString('th-TH');
}

export function formatDate(dateStr: string): string {
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
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

export function getRfqFilterId(status: string): RfqFilterId | null {
  const u = status.toUpperCase();
  if (u === 'OP' || status === 'pending') return 'pending';
  if (
    u === 'OFFERS_RECEIVED' ||
    u === 'REVIEWING' ||
    status === 'offers_received' ||
    status === 'reviewing'
  ) {
    return 'has_quote';
  }
  if (u === 'CC' || status === 'cancelled' || status === 'expired') return 'cancelled_expired';
  if (u === 'CL' || status === 'completed') return null;
  return null;
}
