/**
 * ค่าคงที่และ config สำหรับหน้า RFQ & คำสั่งซื้อ
 */

export const PRIMARY_COLOR = '#6C47FF';
export const PRIMARY_BG = '#EDE9FF';
export const PRIMARY_BG_LIGHT = '#F1EEFF';

export const RFQ_STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#EA580C', bg: '#FFEDD5' },
  offers_received: { label: 'มีใบเสนอราคา', color: '#0284C7', bg: '#E0F2FE' },
  reviewing: { label: 'มีใบเสนอราคา', color: '#0284C7', bg: '#E0F2FE' },
  cancelled: { label: 'ยกเลิก', color: '#6B7280', bg: '#F3F4F6' },
  expired: { label: 'หมดอายุ', color: '#B45309', bg: '#FEF3C7' },
};

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE', dot: '#3B82F6' },
  shipped: { label: 'จัดส่งแล้ว', color: '#F59E0B', bg: '#FEF3C7', dot: '#F59E0B' },
  completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7', dot: '#22C55E' },
  pending: { label: 'รอดำเนินการ', color: '#6B7280', bg: '#F3F4F6', dot: '#9CA3AF' },
};

export type RfqFilterId = 'pending' | 'has_quote' | 'cancelled_expired';
export type OrderFilterId = 'in_production' | 'shipped' | 'completed';
