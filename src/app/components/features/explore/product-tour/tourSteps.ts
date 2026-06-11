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
    title: 'มีโรงงานเยอะมากเลย!',
    desc: 'โรงงานไทยเยอะมาก พร้อมโชว์ผลงานจริง ดูก่อนเลือกได้เลย',
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
    title: 'ให้โรงงานมาหาคุณเอง',
    desc: 'ไม่ต้องเจรจาทีละเจ้าเลย โรงงานหลายแห่งจะส่งราคามาให้คุณเอง',
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
    title: 'บอกความต้องการไว้เลย',
    desc: 'เราจะส่งความต้องการของคุณให้ทุกโรงงานในหมวด ไม่ต้องเสียเวลาหาเอง',
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
    title: 'คุยตรงกับโรงงานเลย',
    desc: 'ไม่ผ่านคนกลาง ปรับแบบ ต่อรองราคา คุยได้เลยตรงๆ',
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
    title: 'ส่ง RFQ ในแชทได้เลย',
    desc: 'แนบคำขอไปในแชท โรงงานจะส่งใบเสนอราคาอย่างเป็นทางการกลับมาให้',
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
    title: 'เลือกข้อเสนอที่ดีสุด',
    desc: 'ดูราคาและเงื่อนไขจากหลายโรงงานในที่เดียว เปรียบเทียบง่ายมาก',
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
    title: 'สั่งงาน ติดตามได้เลย',
    desc: 'ติดตามสถานะการผลิตได้ทุกขั้นตอน Tryly พร้อมเป็นคนกลางระหว่างคุณและโรงงาน',
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
  // /messages list → navigate ไป /messages/:id เพื่อแสดง tour
  { test: (p) => p === '/messages', pageKey: 'messages-list' },
  { test: (p) => p.startsWith('/messages/'), pageKey: 'messages' },
  { test: (p) => /^\/rfqs\/\d+/.test(p), pageKey: 'rfq-detail' },
  // /orders list → เล่น rfq-detail + order-detail steps ต่อกัน (navigate ผ่าน mock routes)
  { test: (p) => p === '/orders', pageKey: 'orders-journey' },
  { test: (p) => /^\/orders\/\d+/.test(p), pageKey: 'order-detail' },
];

/**
 * pageKey ที่ tour จะ navigate ข้ามหน้า (เหมือน full tour แต่เฉพาะ steps ของตัวเอง)
 * เมื่อปิด tour จะ navigate กลับไปยัง originPath
 */
export const NAV_PAGE_KEYS = new Set(['messages-list', 'orders-journey']);

// messages-list: เมื่อมาที่ /messages → แสดง steps ของ 'messages' (navigate ไป /messages/:id)
PAGE_TOUR_STEPS['messages-list'] = PAGE_TOUR_STEPS['messages'] ?? [];

// orders-journey: เมื่อมาที่ /orders → รวม rfq-detail + order-detail ต่อกัน
PAGE_TOUR_STEPS['orders-journey'] = [
  ...(PAGE_TOUR_STEPS['rfq-detail'] ?? []),
  ...(PAGE_TOUR_STEPS['order-detail'] ?? []),
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
