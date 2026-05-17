/**
 * แมปรหัสสถานะ RFQ จาก API → ค่า UI (pending, offers_received, completed, …)
 *
 * OP = เปิดรับใบเสนอราคา
 * CL = ปิดคำขอ (มี AC → completed, ไม่มี → expired)
 * CC = ยกเลิก
 */
export type MapRfqStatusOptions = {
  /** จำนวนใบเสนอราคา (หรือ offers.length) */
  quoteCount?: number;
  /** มี quotation status AC อย่างน้อย 1 ใบ */
  hasAcceptedQuote?: boolean;
};

export function mapRfqStatusFromApi(code: string, options: MapRfqStatusOptions = {}): string {
  const u = String(code ?? '').trim().toUpperCase();
  const hasQuotes = (options.quoteCount ?? 0) > 0;
  const hasAccepted = options.hasAcceptedQuote ?? false;

  if (u === 'OP' || u === 'OPEN' || u === '') {
    return hasQuotes ? 'offers_received' : 'pending';
  }
  if (u === 'CL') {
    return hasAccepted ? 'completed' : 'expired';
  }
  if (u === 'CC') return 'cancelled';
  if (u === 'EX' || u === 'EXPIRED') return 'expired';

  const lower = String(code).toLowerCase();
  const known = [
    'pending',
    'offers_received',
    'reviewing',
    'completed',
    'cancelled',
    'expired',
  ] as const;
  if ((known as readonly string[]).includes(lower)) return lower;
  return lower || 'pending';
}
