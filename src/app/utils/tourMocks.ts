/**
 * Tour mock registry — provides canned API responses while the ProductTour
 * is walking a guest user through the steps. Keeps real navigation working
 * (so the spotlight ring can highlight real components) but ensures every
 * user sees the same demo data even without an account or live order.
 *
 * Lifecycle:
 *   ProductTour.tsx → activateTourMocks('product')        on entering step 3
 *   ProductTour.tsx → activateTourMocks('messages')       on entering step 4
 *   ProductTour.tsx → activateTourMocks('rfq')            on entering step 5
 *   ProductTour.tsx → activateTourMocks('order')          on entering step 6
 *   ProductTour.tsx → clearTourMocks()                    on close/finish
 *
 * Intercept point: services/api.ts → request() checks getTourMockResponse(endpoint)
 * before fetching. If a match is returned, the real network call is skipped.
 */

export type TourScenario = 'product' | 'messages' | 'rfq' | 'order';

type MockEntry = {
  /** Match by exact endpoint (e.g. "/showcases/14") OR by RegExp */
  match: string | RegExp;
  /** HTTP method to intercept; default GET */
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body: unknown;
};

let activeMocks: MockEntry[] = [];
let tourActive = false;
const tourActiveListeners = new Set<(active: boolean) => void>();

/** True while the ProductTour is walking the user through any step. */
export function isTourActive(): boolean {
  return tourActive;
}

export function setTourActive(active: boolean): void {
  if (tourActive === active) return;
  tourActive = active;
  tourActiveListeners.forEach((fn) => fn(active));
}

/** React-friendly subscription. Returns unsubscribe. */
export function subscribeTourActive(fn: (active: boolean) => void): () => void {
  tourActiveListeners.add(fn);
  return () => {
    tourActiveListeners.delete(fn);
  };
}

export function clearTourMocks(): void {
  activeMocks = [];
}

export function activateTourMocks(scenario: TourScenario): void {
  switch (scenario) {
    case 'product':
      activeMocks = [...PRODUCT_MOCKS];
      break;
    case 'messages':
      activeMocks = [...MESSAGES_MOCKS];
      break;
    case 'rfq':
      activeMocks = [...RFQ_MOCKS];
      break;
    case 'order':
      activeMocks = [...ORDER_MOCKS];
      break;
  }
}

export function getTourMockResponse(
  endpoint: string,
  method: string = 'GET',
): unknown | undefined {
  if (activeMocks.length === 0) return undefined;
  for (const m of activeMocks) {
    if ((m.method ?? 'GET') !== method.toUpperCase()) continue;
    if (typeof m.match === 'string') {
      if (m.match === endpoint) return m.body;
    } else if (m.match.test(endpoint)) {
      return m.body;
    }
  }
  return undefined;
}

/* ─── Canned datasets ──────────────────────────────────────────────────── */

const TOUR_FACTORY = {
  factory_id: 9999,
  user_id: 9999,
  factory_name: 'โรงงานสาธิต Tryly Demo',
  image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=400&fit=crop',
  is_verified: true,
  rating: 4.85,
  review_count: 128,
  province: 'กรุงเทพมหานคร',
  specialization: 'ของเล่นและอุปกรณ์สัตว์เลี้ยง',
};

const TOUR_CUSTOMER = {
  user_id: 9000,
  display_name: 'คุณลูกค้าสาธิต',
  first_name: 'ลูกค้า',
  last_name: 'สาธิต',
};

/** User ID injected into AuthContext while tour is running so downstream
 *  hooks (useConversations, ChatRoom, getCurrentUserId, ...) treat the
 *  guest as the demo customer and can load mocked data correctly. */
export const TOUR_GUEST_USER_ID = TOUR_CUSTOMER.user_id;
export const TOUR_GUEST_USER = {
  id: TOUR_CUSTOMER.user_id,
  user_id: TOUR_CUSTOMER.user_id,
  role: 'CT',
  name: TOUR_CUSTOMER.display_name,
  email: 'guest-tour@tryly.demo',
  phone: '',
  company: '',
  avatar: '',
  walletBalance: 0,
  pendingBalance: 0,
  memberSince: '2026-01-01',
  first_name: TOUR_CUSTOMER.first_name,
  last_name: TOUR_CUSTOMER.last_name,
  display_name: TOUR_CUSTOMER.display_name,
} as const;

/* ─── Product detail (showcase_id=14) ──────────────────────────────────── */
const SHOWCASE_14 = {
  showcase_id: 14,
  factory_id: TOUR_FACTORY.factory_id,
  content_type: 'PD',
  title: 'ของเล่นแมว ยางธรรมชาติ',
  excerpt: 'ของเล่นแมวจากยางธรรมชาติ ปลอดสาร BPA ขนาด 5–8 ซม. เหมาะสำหรับแมวทุกวัย',
  content:
    '## คุณสมบัติ\n- ยางธรรมชาติ 100%\n- ปลอดสาร BPA และโลหะหนัก\n- ทนทาน เคี้ยวได้นาน\n- ขนาดเหมาะกับขนาดปาก',
  image_url: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=800&h=800&fit=crop',
  category_id: 3,
  category_name: 'ของเล่นสัตว์เลี้ยง',
  sub_category_id: null,
  base_price: 40,
  promo_price: null,
  moq: 100,
  lead_time_days: 14,
  status: 'AC',
  view_count: 245,
  like_count: 18,
  created_at: '2026-04-25T08:30:00Z',
  factory: TOUR_FACTORY,
  factory_name: TOUR_FACTORY.factory_name,
  factory_image: TOUR_FACTORY.image_url,
  factory_rating: TOUR_FACTORY.rating,
  factory_verified: true,
  images: [
    { image_id: 1, url: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=800&h=800&fit=crop' },
    { image_id: 2, url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop' },
  ],
  linked_showcases: [],
};

const PRODUCT_MOCKS: MockEntry[] = [
  { match: '/showcases/14', body: SHOWCASE_14 },
  // Some pages call factory + factory's other showcases
  { match: `/factories/${TOUR_FACTORY.factory_id}`, body: { ...TOUR_FACTORY, profile: TOUR_FACTORY } },
  { match: new RegExp(`^/factories/${TOUR_FACTORY.factory_id}/showcases`), body: [SHOWCASE_14] },
  // Reviews + view-count update — quietly succeed
  { match: '/showcases/14/view', method: 'POST', body: { ok: true } },
  { match: '/showcases/14/analytics', body: { views: 245, likes: 18 } },
];

/* ─── Messages (conv 9001 with one factory + RFQ chip) ────────────────── */
const TOUR_CONV_ID = 9001;

const TOUR_CONVERSATION = {
  conv_id: TOUR_CONV_ID,
  customer_id: TOUR_CUSTOMER.user_id,
  factory_id: TOUR_FACTORY.factory_id,
  factory_name: TOUR_FACTORY.factory_name,
  factory_image: TOUR_FACTORY.image_url,
  customer_name: TOUR_CUSTOMER.display_name,
  rfq_id: 28,
  rfq_title: 'ของเล่นแมว MOQ 100 ชิ้น',
  has_quote: false,
  unread_customer: 0,
  unread_factory: 1,
  last_message: 'สวัสดีค่ะ อยากได้ของเล่นแมว MOQ 100 ชิ้น',
  last_message_at: '2026-04-28T10:35:00Z',
  updated_at: '2026-04-28T10:38:00Z',
  customer: TOUR_CUSTOMER,
  factory: TOUR_FACTORY,
};

const TOUR_MESSAGES = [
  {
    message_id: 'tour-msg-1',
    conv_id: TOUR_CONV_ID,
    sender_id: TOUR_FACTORY.factory_id,
    receiver_id: TOUR_CUSTOMER.user_id,
    content: 'สวัสดีครับ! สนใจสินค้าตัวไหนครับ? 🐾',
    message_type: 'TX',
    is_read: true,
    created_at: '2026-04-28T10:32:00Z',
  },
  {
    message_id: 'tour-msg-2',
    conv_id: TOUR_CONV_ID,
    sender_id: TOUR_CUSTOMER.user_id,
    receiver_id: TOUR_FACTORY.factory_id,
    content: 'สวัสดีค่ะ อยากได้ของเล่นแมว MOQ 100 ชิ้น ราคาต่อชิ้นเท่าไหร่คะ?',
    message_type: 'TX',
    is_read: true,
    created_at: '2026-04-28T10:35:00Z',
  },
  {
    message_id: 'tour-msg-3',
    conv_id: TOUR_CONV_ID,
    sender_id: TOUR_FACTORY.factory_id,
    receiver_id: TOUR_CUSTOMER.user_id,
    content:
      'ราคา 40 บาท/ชิ้นครับ กรุณาส่ง RFQ มาเพื่อยืนยันรายละเอียดและรับใบเสนอราคาอย่างเป็นทางการ 🙏',
    message_type: 'TX',
    is_read: true,
    created_at: '2026-04-28T10:38:00Z',
  },
];

const MESSAGES_MOCKS: MockEntry[] = [
  { match: '/conversations', body: [TOUR_CONVERSATION] },
  { match: `/conversations/${TOUR_CONV_ID}`, body: TOUR_CONVERSATION },
  { match: new RegExp(`^/messages\\?conv_id=${TOUR_CONV_ID}(&|$)`), body: TOUR_MESSAGES },
  { match: `/conversations/${TOUR_CONV_ID}/read`, method: 'PATCH', body: { ok: true } },
];

export const TOUR_MESSAGES_CONV_ID = TOUR_CONV_ID;

/* ─── RFQ detail (rfq_id=28) ───────────────────────────────────────────── */
const RFQ_28 = {
  rfq: {
    rfq_id: 28,
    user_id: TOUR_CUSTOMER.user_id,
    title: 'ของเล่นแมว MOQ 100 ชิ้น',
    details:
      'ต้องการผลิตของเล่นแมวจากยางธรรมชาติ ปลอดภัยสำหรับสัตว์เลี้ยง ขนาด 5–8 ซม. จำนวน 100 ชิ้น',
    quantity: 100,
    status: 'OP',
    category_id: 3,
    category_name: 'ของเล่นสัตว์เลี้ยง',
    sub_category_id: null,
    sub_category_name: null,
    target_unit_price: 50,
    target_lead_time_days: 14,
    required_delivery_date: '2026-05-15',
    material_grade: 'ยางธรรมชาติปลอดสาร BPA',
    image_urls: [
      'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=600&h=600&fit=crop',
    ],
    address: { province: 'กรุงเทพมหานคร', district: 'บางกะปิ' },
    address_summary: 'กรุงเทพมหานคร',
    created_at: '2026-04-26T14:00:00Z',
    uploaded_at: '2026-04-26T14:00:00Z',
  },
  offers: [
    {
      quotation_id: 9101,
      factory_id: TOUR_FACTORY.factory_id,
      factory_name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
      factory_image: TOUR_FACTORY.image_url,
      price: 42000,
      lead_time: 8,
      lead_time_days: 8,
      rating: 4.9,
      verified: true,
      recommended: true,
      ai_reason: 'ราคาคุ้มค่าที่สุด + งานไวสุด',
      status: 'PD',
    },
    {
      quotation_id: 9102,
      factory_id: 9998,
      factory_name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
      price: 38500,
      lead_time: 12,
      lead_time_days: 12,
      rating: 4.6,
      verified: false,
      recommended: false,
      ai_reason: 'ราคาถูกที่สุด แต่ lead time นานกว่า',
      status: 'PD',
    },
    {
      quotation_id: 9103,
      factory_id: 9997,
      factory_name: 'ของเล่นสัตว์เลี้ยง แฮปปี้',
      price: 48000,
      lead_time: 7,
      lead_time_days: 7,
      rating: 4.8,
      verified: true,
      recommended: false,
      ai_reason: 'ส่งเร็วที่สุด แต่ราคาสูงกว่า',
      status: 'PD',
    },
  ],
};

const RFQ_MOCKS: MockEntry[] = [
  { match: '/rfqs/28', body: RFQ_28 },
  { match: '/frontend/rfqs/28', body: RFQ_28 },
];

/* ─── Order detail (order_id=17) ───────────────────────────────────────── */
const ORDER_17 = {
  order_id: 17,
  customer_id: TOUR_CUSTOMER.user_id,
  factory_id: TOUR_FACTORY.factory_id,
  factory_name: TOUR_FACTORY.factory_name,
  factory_image: TOUR_FACTORY.image_url,
  product_name: 'สายจูงและปลอกคอสัตว์เลี้ยง',
  quantity: 500,
  total_amount: 42000,
  deposit_amount: 21000,
  remaining_amount: 21000,
  deposit_paid: 21000,
  status: 'PR',
  status_label: 'กำลังผลิต',
  progress_percent: 65,
  estimated_delivery: '2026-05-20',
  created_at: '2026-01-15T09:00:00Z',
  rfq: {
    rfq_id: 28,
    title: 'ของเล่นแมว MOQ 100 ชิ้น',
    category_name: 'ของเล่นสัตว์เลี้ยง',
  },
  payment_schedule: [
    { stage: 'DEPOSIT', amount: 21000, paid_at: '2026-01-15T09:30:00Z', status: 'PAID' },
    { stage: 'FINAL', amount: 21000, paid_at: null, status: 'PENDING', due_date: '2026-05-20' },
  ],
  production_updates: [
    {
      step_code: 'CONFIRM',
      step_name: 'ยืนยันคำสั่งซื้อ',
      status: 'CD',
      completed_at: '2026-01-15T10:00:00Z',
      description: 'ชำระมัดจำและยืนยันแล้ว',
    },
    {
      step_code: 'MATERIAL',
      step_name: 'จัดซื้อวัตถุดิบ',
      status: 'CD',
      completed_at: '2026-01-18T14:00:00Z',
      description: 'ไนลอนและหนังสังเคราะห์พร้อมแล้ว',
    },
    {
      step_code: 'PRODUCTION',
      step_name: 'เริ่มกระบวนการผลิต',
      status: 'CD',
      completed_at: '2026-01-22T08:00:00Z',
      description: 'ตัดเย็บและประกอบตามแบบ',
    },
    {
      step_code: 'QC1',
      step_name: 'Quality Check ครั้งที่ 1',
      status: 'IP',
      description: 'ตรวจสอบความแข็งแรงของชิ้นงาน',
    },
    { step_code: 'PACKAGING', step_name: 'บรรจุและติดฉลาก', status: 'PD' },
    { step_code: 'QC_FINAL', step_name: 'QC ขั้นสุดท้ายและจัดส่ง', status: 'PD' },
  ],
};

const ORDER_MOCKS: MockEntry[] = [
  { match: '/orders/17', body: ORDER_17 },
  { match: '/frontend/orders/17', body: ORDER_17 },
];
