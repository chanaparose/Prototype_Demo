export type HowToOrderTabId = 'video' | 'steps' | 'start';

/** Video + RFQ tab content for HowToOrderSection */
export const HOW_TO_ORDER_MEDIA = {
  enabled: true,
  defaultTab: 'steps' as HowToOrderTabId,
  tabs: [
    { id: 'video' as const, label: 'วิดีโอ' },
    { id: 'steps' as const, label: '4 ขั้นตอน' },
    { id: 'start' as const, label: 'ส่ง RFQ' },
  ],
  video: {
    title: 'รู้จัก Tryly ใน 2 นาที',
    subtitle: 'ดูวิธีค้นหาโรงงานและส่งคำขอราคา',
    thumbnailUrl: '/assets/tryly-banner-final.png',
    durationLabel: '2:00',
    videoUrl: '',
  },
  start: {
    title: 'พร้อมส่งคำขอราคาแล้ว?',
    subtitle: 'โรงงานที่สนใจจะตอบกลับภายใน 24–48 ชม.',
    cta: 'สร้าง RFQ ฟรี',
    href: '/create-rfq',
  },
} as const;
