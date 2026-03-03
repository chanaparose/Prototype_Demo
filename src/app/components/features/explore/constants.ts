export const PROMO_SLIDES = [
  {
    id: '1',
    title: 'ลด 15% ค่าผลิตครั้งแรก',
    subtitle: 'ใช้โค้ดนี้เมื่อสร้าง RFQ ใหม่ หมดเขต 31 มี.ค. 2026',
    code: 'FIRST15',
  },
  {
    id: '2',
    title: 'ส่วนลด 500 บาท',
    subtitle: 'เมื่อสั่งซื้อขั้นต่ำ 5,000 บาท หมดเขต 30 เม.ย. 2026',
    code: 'PET500',
  },
  {
    id: '3',
    title: 'ฟรีค่าจัดส่ง',
    subtitle: 'ออเดอร์แรกเท่านั้น หมดเขต 15 พ.ค. 2026',
    code: 'FREESHIP',
  },
];

export const EXPLORE_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  offers_received: { label: 'มีใบเสนอราคา', color: '#6C47FF', bg: '#EDE9FF' },
  reviewing: { label: 'กำลังพิจารณา', color: '#F59E0B', bg: '#FEF3C7' },
  pending: { label: 'รอใบเสนอราคา', color: '#6B7280', bg: '#F3F4F6' },
  in_production: { label: 'กำลังผลิต', color: '#3B82F6', bg: '#DBEAFE' },
  shipped: { label: 'จัดส่งแล้ว', color: '#22C55E', bg: '#DCFCE7' },
  completed: { label: 'เสร็จสิ้น', color: '#22C55E', bg: '#DCFCE7' },
};
