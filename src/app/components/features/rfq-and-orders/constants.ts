/**
 * ค่าคงที่และ config สำหรับหน้า คำขอราคา & คำสั่งซื้อ
 * โทนสีอ้างอิงภาพประกอบ (ม่วงหลายระดับ / ส้ม / พีช / ครีม / แทน)
 */

/** ม่วงหลัก (แม็กนีตา) */
export const PRIMARY_COLOR = 'var(--brand-purple)';
export const PRIMARY_BG = 'var(--brand-lavender)';
export const PRIMARY_BG_LIGHT = '#FBF8FF';

/** ม่วงพลัม / วิโอเลตกลาง (พื้นที่ม่วงเข้มบนภาพ) */
export const PLUM = 'var(--brand-violet-deep)';
export const PLUM_SOFT_BG = 'var(--brand-violet-soft)';

/** น้ำเงินเข้ม / มิดไนท์ (เงา, ตัวหนังสือเน้น) */
export const DEEP_PURPLE = 'var(--brand-navy-deep)';

/** ลิลลา / ออร์คิดอ่อน */
export const LILAC_MUTED = '#E8DDF5';
export const ORCHID = '#A78BFA';

/** ส้มสด / ส้มเข้ม / พีช */
export const ACCENT_ORANGE = 'var(--brand-orange)';
export const ACCENT_ORANGE_DEEP = 'var(--brand-orange-vivid)';
export const ACCENT_ORANGE_BG = 'var(--surface-peach)';
export const PEACH_SOFT = '#FFE8D6';
export const PEACH_MIST = 'var(--surface-peach-mist)';
export const CREAM = 'var(--surface-cream)';

/** ส้มแทน / ขอบอุ่น (แทนที่เทาเย็น) */
export const TAN_MUTED = '#C4A484';
export const BORDER_WARM = 'rgba(196, 164, 132, 0.4)';

/** พื้นแท็บหลักมือถือ — ไล่ลาเวนเดอร์ → พีช */
export const MOBILE_PRIMARY_TAB_BAR =
  'linear-gradient(135deg, var(--brand-lavender) 0%, var(--surface-cream-warm) 48%, var(--surface-cream-orange) 100%)';

/** ปุ่ม CTA — ไล่มิดไนท์ → พลัม → แม็กนีตา */
export const CTA_GRADIENT =
  'linear-gradient(135deg, #1A0F2E 0%, #4A267D 45%, var(--brand-purple) 100%)';

export const BADGE_ALERT_BG = 'var(--brand-orange-hot)';

export const PROGRESS_GRADIENT_ACTIVE =
  'linear-gradient(90deg, var(--brand-violet-deep) 0%, var(--brand-purple) 45%, var(--brand-orange) 100%)';

export const PROGRESS_COMPLETED =
  'linear-gradient(90deg, var(--brand-navy-deep) 0%, var(--brand-violet-deep) 100%)';

export type RfqFilterId = 'pending' | 'has_quote' | 'cancelled_expired';
export type OrderFilterId =
  | 'pending_payment'
  | 'in_production'
  | 'shipped'
  | 'completed'
  | 'cancelled_expired';

/** ธีมแท็บกรอง RFQ — แยกสีตามแท็บ */
export const RFQ_FILTER_THEME: Record<
  RfqFilterId,
  { activeBg: string; activeColor: string; badgeInactive: string }
> = {
  pending: {
    activeBg: PEACH_MIST,
    activeColor: ACCENT_ORANGE_DEEP,
    badgeInactive: BADGE_ALERT_BG,
  },
  has_quote: {
    activeBg: PLUM_SOFT_BG,
    activeColor: PLUM,
    badgeInactive: PLUM,
  },
  cancelled_expired: {
    activeBg: LILAC_MUTED,
    activeColor: DEEP_PURPLE,
    badgeInactive: '#7C6F9E',
  },
};

/** ธีมแท็บคำสั่งซื้อ (มือถือ) — สลับม่วง / ส้ม / มิดไนท์ */
export const ORDER_MOBILE_TAB_THEME: Record<
  OrderFilterId,
  { activeBg: string; activeColor: string; badgeInactive: string }
> = {
  pending_payment: {
    activeBg: PEACH_MIST,
    activeColor: ACCENT_ORANGE_DEEP,
    badgeInactive: BADGE_ALERT_BG,
  },
  in_production: {
    activeBg: PLUM_SOFT_BG,
    activeColor: PLUM,
    badgeInactive: PLUM,
  },
  shipped: {
    activeBg: PEACH_SOFT,
    activeColor: '#C2410C',
    badgeInactive: ACCENT_ORANGE,
  },
  completed: {
    activeBg: '#ECE9F2',
    activeColor: DEEP_PURPLE,
    badgeInactive: ORCHID,
  },
  cancelled_expired: {
    activeBg: LILAC_MUTED,
    activeColor: DEEP_PURPLE,
    badgeInactive: '#7C6F9E',
  },
};

export const RFQ_STATUS_DISPLAY: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'รอดำเนินการ', color: '#C2410C', bg: PEACH_MIST },
  offers_received: { label: 'มีใบเสนอราคา', color: PLUM, bg: PLUM_SOFT_BG },
  reviewing: { label: 'มีใบเสนอราคา', color: PLUM, bg: PLUM_SOFT_BG },
  /** RFQ.status = CL (Closed) หลังลูกค้ายอมรับใบเสนอราคา */
  completed: {
    label: 'ปิดคำขอแล้ว',
    color: 'var(--status-success)',
    bg: 'var(--status-success-soft)',
  },
  cancelled: { label: 'ยกเลิก', color: '#5B5470', bg: LILAC_MUTED },
  expired: { label: 'หมดอายุ', color: '#9A3412', bg: '#F5E6D8' },
};

export const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  pending_payment: {
    label: 'รอชำระมัดจำ',
    color: ACCENT_ORANGE_DEEP,
    bg: PEACH_MIST,
    dot: ACCENT_ORANGE,
  },
  in_production: {
    label: 'กำลังผลิต',
    color: PLUM,
    bg: PLUM_SOFT_BG,
    dot: PRIMARY_COLOR,
  },
  shipped: {
    label: 'จัดส่งแล้ว',
    color: '#C2410C',
    bg: PEACH_SOFT,
    dot: ACCENT_ORANGE,
  },
  completed: {
    label: 'เสร็จสิ้น',
    color: DEEP_PURPLE,
    bg: CREAM,
    dot: ORCHID,
  },
  cancelled_expired: {
    label: 'ยกเลิก/หมดอายุ',
    color: '#5B5470',
    bg: LILAC_MUTED,
    dot: '#7C6F9E',
  },
  pending: {
    label: 'รอดำเนินการ',
    color: '#6B5B7A',
    bg: LILAC_MUTED,
    dot: TAN_MUTED,
  },
};
