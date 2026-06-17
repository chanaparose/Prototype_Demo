/** Explore media slot — swap videoUrl when CMS is ready */
export const EXPLORE_MEDIA_CONFIG = {
  enabled: true,
  title: 'รู้จัก Tryly ใน 2 นาที',
  subtitle: 'ดูวิธีค้นหาโรงงานและส่งคำขอราคา (RFQ)',
  thumbnailUrl: '/assets/tryly-banner-final.png',
  /** YouTube embed URL or empty for thumbnail-only placeholder */
  videoUrl: '',
  bullets: [
    'ค้นหาโรงงานและสินค้าตามหมวดหมู่',
    'ส่ง RFQ ฟรี รับใบเสนอราคาจากหลายโรงงาน',
    'คุยรายละเอียดและสั่งผลิตผ่านระบบ Tryly',
  ],
} as const;
