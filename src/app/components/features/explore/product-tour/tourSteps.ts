import { TOUR_MESSAGES_CONV_ID } from '@/utils/tourMocks';
import type { TourStepDef } from '@/components/features/explore/product-tour/tourTypes';

/** Full 7-step tour (กดปุ่ม "สาธิตการใช้งาน") */
export const TOUR_STEPS: TourStepDef[] = [
  {
    route: '/factory-ideas',
    pageKey: 'factory-ideas',
    mockScenario: 'browse',
    targetSelector: '[data-tour="tab-product"]',
    targetTexts: ['สินค้า', 'ทั้งหมด'],
    spotlightRadius: 24,
    spotlightPad: 6,
    badgeColor: 'var(--brand-purple)',
    icon: '🔍',
    badge: 'ขั้นตอนที่ 1 / 7',
    title: 'เลือกดูสินค้าและโรงงาน',
    desc: 'เลือกดูสินค้าตัวอย่าง วัตถุดิบ และโรงงานที่สนใจ กรองตามหมวดหมู่ tab ด้านบน หรือค้นหาโดยตรงได้เลย',
    tip: '💡 กด tab "สินค้า" เพื่อดูตัวอย่างที่โรงงานเคยผลิต',
  },
  {
    route: '/',
    pageKey: 'explore',
    targetSelector: '[data-tour="create-rfq-cta"], [data-tour="fab"]',
    targetTexts: ['สร้างคำขอราคา'],
    spotlightRadius: 12,
    spotlightPad: 8,
    cardPlacement: 'top',
    badgeColor: 'var(--brand-orange)',
    icon: '➕',
    badge: 'ขั้นตอนที่ 2 / 7',
    title: 'กดปุ่มสร้างคำขอราคา',
    desc: 'เมื่อต้องการเริ่มต้น กดปุ่ม "สร้างคำขอราคา" ที่ sidebar (Desktop) หรือ ปุ่มลอย "+" มุมขวาล่าง (Mobile) เพื่อเข้าสู่ฟอร์มสร้าง คำขอราคา',
    tip: '➕ ปุ่มนี้จะอยู่กับคุณตลอดทุกหน้า กดได้เมื่อพร้อม',
  },
  {
    route: '/create-rfq',
    pageKey: 'create-rfq',
    mockScenario: 'createRfq',
    targetSelector: '[data-tour="request-kind"]',
    targetTexts: ['ประเภทคำขอ', 'ขอตัวอย่างสินค้า', 'ขอราคาผลิต'],
    spotlightRadius: 14,
    spotlightPad: 10,
    badgeColor: 'var(--brand-orange)',
    icon: '📋',
    badge: 'ขั้นตอนที่ 3 / 7',
    title: 'เลือกประเภทคำขอที่เหมาะกับคุณ',
    desc: 'นอกจาก "ขอราคาผลิต OEM" แล้ว คุณยังสามารถเลือก "ขอตัวอย่างสินค้า" หรือ "ขอตัวอย่างวัตถุดิบ" เพื่อทดลองคุณภาพก่อนสั่งจริง',
    tip: '📋 แนะนำเริ่มจาก "ขอตัวอย่างสินค้า" ถ้ายังไม่แน่ใจคุณภาพโรงงาน',
  },
  {
    route: '/product-detail?showcase_id=14',
    pageKey: 'product-detail',
    mockScenario: 'product',
    targetTexts: ['แชทกับโรงงาน', 'แชท'],
    spotlightRadius: 12,
    cardPlacement: 'top',
    badgeColor: 'var(--brand-teal)',
    icon: '💬',
    badge: 'ขั้นตอนที่ 4 / 7',
    title: 'แชทกับโรงงานที่สนใจ',
    desc: 'กดปุ่ม "แชทกับโรงงาน" เพื่อคุยรายละเอียดโดยตรง ปรับแบบ ขอตัวอย่าง หรือต่อรองราคาได้เลย',
    tip: '💬 โรงงานใน Tryly ทุกรายพร้อมตอนกลับลูกค้าทุกท่าน',
  },
  {
    route: `/messages/${TOUR_MESSAGES_CONV_ID}`,
    pageKey: 'messages',
    mockScenario: 'messages',
    targetTexts: ['📎', 'แนบ RFQ', 'RFQ', 'พิมพ์ข้อความ'],
    spotlightRadius: 10,
    cardPlacement: 'top',
    badgeColor: 'var(--status-info)',
    icon: '📩',
    badge: 'ขั้นตอนที่ 5 / 7',
    title: 'ส่ง คำขอราคา ให้โรงงานใน Chat',
    desc: 'แนบคำขอราคาที่สร้างไว้ในห้องแชท เพื่อให้โรงงานส่งใบเสนอราคาอย่างเป็นทางการกลับมา',
    tip: '📩 โรงงานจะส่งใบเสนอราคาผ่าน Chat และในหน้า คำขอราคา & คำสั่งงาน',
  },
  {
    route: '/rfqs/28',
    pageKey: 'rfq-detail',
    mockScenario: 'rfq',
    preActionSelector: '[data-tour="tab-offers"]',
    targetSelector: '[data-tour="offer-card"][data-factory-id="9998"]',
    targetTexts: ['แพ็กเกจจิ้งสัตว์เลี้ยง โปร', 'ยอมรับข้อเสนอ'],
    spotlightRadius: 14,
    spotlightPad: 8,
    badgeColor: 'var(--brand-violet)',
    icon: '⚖️',
    badge: 'ขั้นตอนที่ 6 / 7',
    title: 'เปรียบเทียบและยอมรับข้อเสนอ',
    desc: 'ดูรายละเอียดใบเสนอราคาจากหลายโรงงาน เปรียบเทียบราคา เงื่อนไข และยอมรับข้อเสนอได้',
    tip: '⚖️ ระบบจะแนะนำโรงงานที่คุ้มค่าที่สุดสำหรับงานของคุณ',
  },
  {
    route: '/orders/17',
    pageKey: 'order-detail',
    mockScenario: 'order',
    targetSelector: '[data-tour="order-tabs"]',
    targetTexts: ['การผลิต', 'ภาพรวม'],
    spotlightRadius: 12,
    spotlightPad: 6,
    cardPlacement: 'bottom',
    badgeColor: 'var(--status-success-bright)',
    icon: '✅',
    badge: 'ขั้นตอนที่ 7 / 7',
    title: 'จ่ายเงินและติดตามสถานะ',
    desc: 'ชำระเงินผ่านระบบ Tryly แล้วติดตามสถานะการผลิตจนถึงมือคุณ',
    tip: '🔒 เงินจะโอนให้โรงงานเมื่อคุณรับสินค้าแล้วเท่านั้น',
  },
];

/**
 * Per-page tour steps — map จาก pageKey → steps ที่จะแสดงเมื่อเข้าหน้านั้นครั้งแรก
 * steps เหล่านี้จะ highlight element บนหน้าปัจจุบัน ไม่ navigate ข้ามหน้า
 */
export const PAGE_TOUR_STEPS: Record<string, TourStepDef[]> = {};

// สร้าง map อัตโนมัติจาก TOUR_STEPS โดยกลุ่มตาม pageKey
for (const step of TOUR_STEPS) {
  if (!step.pageKey) continue;
  if (!PAGE_TOUR_STEPS[step.pageKey]) PAGE_TOUR_STEPS[step.pageKey] = [];
  PAGE_TOUR_STEPS[step.pageKey].push(step);
}

/**
 * Map จาก pathname pattern → pageKey
 * ใช้ตรวจสอบว่าหน้าไหนมี page tour และควรแสดงครั้งแรกไหม
 */
export const PATH_TO_PAGE_KEY: Array<{ test: (p: string) => boolean; pageKey: string }> = [
  { test: (p) => p === '/', pageKey: 'explore' },
  { test: (p) => p === '/factory-ideas' || p.startsWith('/factory-ideas/'), pageKey: 'factory-ideas' },
  { test: (p) => p === '/create-rfq', pageKey: 'create-rfq' },
  { test: (p) => p.startsWith('/product-detail'), pageKey: 'product-detail' },
  { test: (p) => p.startsWith('/messages/'), pageKey: 'messages' },
  { test: (p) => /^\/rfqs\/\d+/.test(p), pageKey: 'rfq-detail' },
  { test: (p) => /^\/orders\/\d+/.test(p), pageKey: 'order-detail' },
];

/** localStorage key สำหรับ per-page tour */
export const PAGE_TOUR_SEEN_PREFIX = 'tryly_page_tour_v1:';

export function getPageKey(pathname: string): string | null {
  for (const { test, pageKey } of PATH_TO_PAGE_KEY) {
    if (test(pathname)) return pageKey;
  }
  return null;
}

export function isPageTourSeen(pageKey: string): boolean {
  return !!localStorage.getItem(`${PAGE_TOUR_SEEN_PREFIX}${pageKey}`);
}

export function markPageTourSeen(pageKey: string): void {
  localStorage.setItem(`${PAGE_TOUR_SEEN_PREFIX}${pageKey}`, '1');
}
