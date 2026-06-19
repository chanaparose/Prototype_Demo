export type HowToOrderTabId = 'steps' | 'start';

/** RFQ tab content for HowToOrderSection */
export const HOW_TO_ORDER_MEDIA = {
  enabled: true,
  defaultTab: 'steps' as HowToOrderTabId,
  tabs: [
    { id: 'steps' as const, label: '4 ขั้นตอน' },
    { id: 'start' as const, label: 'ส่ง RFQ' },
  ],
  start: {
    title: 'พร้อมส่งคำขอราคาแล้ว?',
    subtitle: 'โรงงานที่สนใจจะตอบกลับภายใน 24–48 ชม.',
    cta: 'สร้าง RFQ ฟรี',
    href: '/create-rfq',
  },
} as const;
