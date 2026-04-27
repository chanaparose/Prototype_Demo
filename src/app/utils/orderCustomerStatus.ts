/**
 * แมปรหัสสถานะออเดอร์จาก API → ค่า UI ในลูกค้า (RFQ & คำสั่งซื้อ / order detail)
 * PP = รอชำระมัดจำ (FE_ORDER_PAYMENT_ALIGNMENT / PAYMENT_ORDER_FLOW)
 */
export function mapOrderStatusFromApi(code: string): string {
  const u = String(code ?? '').toUpperCase();
  if (u === 'PP' || u === 'PE') return 'pending_payment';
  if (u === 'PR' || u === 'QC' || u === 'WF') return 'in_production';
  if (u === 'SH') return 'shipped';
  if (u === 'CP') return 'completed';
  if (u === 'CC' || u === 'CN' || u === 'EX') return 'cancelled_expired';
  return u.toLowerCase() || 'pending';
}

export function guessOrderProgress(status: string): number {
  switch (status) {
    case 'pending_payment':
      return 10;
    case 'in_production':
      return 35;
    case 'shipped':
      return 85;
    case 'completed':
      return 100;
    default:
      return 0;
  }
}
