/**
 * Tour mock registry — provides canned API responses while the ProductTour
 * is walking a guest user through the steps. Keeps real navigation working
 * (so the spotlight ring can highlight real components) but ensures every
 * user sees the same demo data even without an account or live order.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Endpoint mapping  (updated 2026-05-23)
 *
 * Step 0  /factory-ideas     → 'browse'   : categories, showcases, factories
 * Step 2  /create-rfq        → 'createRfq': LBI categories, sub-categories, preview-factories
 * Step 3  /product-detail    → 'product'  : GET /showcases/:id, POST /showcases/:id/view, related
 * Step 4  /messages/:id      → 'messages' : conversations list, conversation detail, messages list
 * Step 5  /rfqs/:id          → 'rfq'      : GET /rfqs/:id/detail (bundle)
 * Step 6  /orders/:id        → 'order'    : GET /orders/:id, GET /wallet/me
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Intercept point: services/api/httpClient.ts → getTourMockResponse(endpoint)
 * before fetching. If a match is returned, the real network call is skipped.
 */

export type TourScenario = 'browse' | 'createRfq' | 'product' | 'messages' | 'rfq' | 'order';

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
    case 'browse':
      activeMocks = [...BROWSE_MOCKS];
      break;
    case 'createRfq':
      activeMocks = [...CREATE_RFQ_MOCKS];
      break;
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

export function getTourMockResponse(endpoint: string, method: string = 'GET'): unknown | undefined {
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

// ═══════════════════════════════════════════════════════════════════════════
// Shared entities
// ═══════════════════════════════════════════════════════════════════════════

const TOUR_FACTORY = {
  factory_id: 9999,
  user_id: 9999,
  factory_name: 'โรงงานสาธิต Tryly Demo',
  image_url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=400&fit=crop',
  is_verified: true,
  rating: 4.85,
  review_count: 128,
  province: 'กรุงเทพมหานคร',
  province_name: 'กรุงเทพมหานคร',
  specialization: 'ของเล่นและอุปกรณ์สัตว์เลี้ยง',
  factory_type_name: 'สินค้าสัตว์เลี้ยง',
  min_order: 100,
  lead_time_desc: '7-14 วัน',
  completed_orders: 48,
  tags: ['ของเล่นสัตว์เลี้ยง', 'อุปกรณ์สัตว์เลี้ยง'],
};

const TOUR_CUSTOMER = {
  user_id: 9000,
  display_name: 'คุณลูกค้าสาธิต',
  first_name: 'ลูกค้า',
  last_name: 'สาธิต',
};

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
    {
      image_id: 1,
      url: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=800&h=800&fit=crop',
    },
    {
      image_id: 2,
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop',
    },
  ],
  linked_showcases: [],
  // sections for rich detail rendering
  sections: [
    {
      section_id: 1,
      section_type: 'text',
      title: 'คุณสมบัติเด่น',
      content: 'ยางธรรมชาติ 100% ปลอดสาร BPA ทนทาน',
      sort_order: 1,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Step 0: Browse  — /factory-ideas
// FE calls: GET /categories?include_sub=true&limit=0
//           GET /showcases?types=PD,PM,ID,MT&page=1&limit=80
//           GET /factories
// ═══════════════════════════════════════════════════════════════════════════

const TOUR_CATEGORIES = [
  {
    category_id: 1,
    name: 'เสื้อผ้าและแฟชั่น',
    sub_categories: [
      { sub_category_id: 101, id: 101, name: 'เสื้อยืด', sort_order: 1 },
      { sub_category_id: 102, id: 102, name: 'กระเป๋า', sort_order: 2 },
    ],
  },
  {
    category_id: 2,
    name: 'อาหารและเครื่องดื่ม',
    sub_categories: [
      { sub_category_id: 201, id: 201, name: 'ขนมขบเคี้ยว', sort_order: 1 },
    ],
  },
  {
    category_id: 3,
    name: 'ของเล่นสัตว์เลี้ยง',
    sub_categories: [
      { sub_category_id: 301, id: 301, name: 'ของเล่นแมว', sort_order: 1 },
      { sub_category_id: 302, id: 302, name: 'ของเล่นสุนัข', sort_order: 2 },
    ],
  },
  {
    category_id: 4,
    name: 'เครื่องสำอางและความงาม',
    sub_categories: [],
  },
];

const TOUR_SHOWCASES_LIST = {
  total: 3,
  page: 1,
  limit: 80,
  items: [
    {
      ...SHOWCASE_14,
    },
    {
      showcase_id: 15,
      factory_id: 9998,
      content_type: 'PD',
      title: 'สายจูงสุนัข ไนลอนเกรด A',
      excerpt: 'สายจูงสุนัขไนลอนเกรด A ทนทาน ยาว 1.2 เมตร',
      image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop',
      category_id: 3,
      category_name: 'ของเล่นสัตว์เลี้ยง',
      base_price: 85,
      moq: 200,
      status: 'AC',
      view_count: 120,
      like_count: 9,
      created_at: '2026-04-20T10:00:00Z',
      factory_name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
      factory_image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop',
      factory_rating: 4.6,
      factory_verified: false,
    },
    {
      showcase_id: 16,
      factory_id: 9997,
      content_type: 'PM',
      title: 'โปรโมชัน ปลอกคอแมว ลด 20%',
      excerpt: 'ปลอกคอแมวหนังสังเคราะห์ ลาย Minimal ลด 20% สั่งขั้นต่ำ 50 ชิ้น',
      image_url: 'https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=800&h=800&fit=crop',
      category_id: 3,
      category_name: 'ของเล่นสัตว์เลี้ยง',
      base_price: 120,
      promo_price: 96,
      moq: 50,
      status: 'AC',
      view_count: 88,
      like_count: 12,
      created_at: '2026-04-22T09:00:00Z',
      factory_name: 'ของเล่นสัตว์เลี้ยง แฮปปี้',
      factory_image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
      factory_rating: 4.8,
      factory_verified: true,
    },
  ],
};

const TOUR_FACTORIES_LIST = [
  {
    factory_id: TOUR_FACTORY.factory_id,
    factory_name: TOUR_FACTORY.factory_name,
    factory_type_id: 1,
    factory_type_name: TOUR_FACTORY.factory_type_name,
    specialization: TOUR_FACTORY.specialization,
    rating: TOUR_FACTORY.rating,
    review_count: TOUR_FACTORY.review_count,
    min_order: TOUR_FACTORY.min_order,
    lead_time_desc: TOUR_FACTORY.lead_time_desc,
    is_verified: true,
    completed_orders: TOUR_FACTORY.completed_orders,
    image_url: TOUR_FACTORY.image_url,
    tags: TOUR_FACTORY.tags,
    province_name: TOUR_FACTORY.province_name,
  },
  {
    factory_id: 9998,
    factory_name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
    factory_type_id: 1,
    factory_type_name: 'สินค้าสัตว์เลี้ยง',
    specialization: 'บรรจุภัณฑ์สำหรับสัตว์เลี้ยง',
    rating: 4.6,
    review_count: 56,
    min_order: 200,
    lead_time_desc: '10-14 วัน',
    is_verified: false,
    completed_orders: 22,
    image_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop',
    tags: ['ของเล่นสัตว์เลี้ยง'],
    province_name: 'ชลบุรี',
  },
];

const BROWSE_MOCKS: MockEntry[] = [
  // GET /categories?include_sub=true&limit=0
  { match: new RegExp('^/categories\\?'), body: TOUR_CATEGORIES },
  // GET /showcases?types=... (paginated)
  { match: new RegExp('^/showcases\\?'), body: TOUR_SHOWCASES_LIST },
  // GET /factories
  { match: '/factories', body: TOUR_FACTORIES_LIST },
];

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: Create RFQ — /create-rfq
// FE calls: GET /lbi/categories?scope=ALL
//           GET /categories/:id/sub-categories  (on category select)
//           GET /rfqs/preview-factories?...      (on category select)
// ═══════════════════════════════════════════════════════════════════════════

const LBI_CATEGORIES = {
  categories: [
    { category_id: 1, name: 'เสื้อผ้าและแฟชั่น', scope: 'PD' },
    { category_id: 2, name: 'อาหารและเครื่องดื่ม', scope: 'PD' },
    { category_id: 3, name: 'ของเล่นสัตว์เลี้ยง', scope: 'PD' },
    { category_id: 4, name: 'เครื่องสำอางและความงาม', scope: 'PD' },
    { category_id: 5, name: 'เฟอร์นิเจอร์และของตกแต่ง', scope: 'PD' },
  ],
};

const CREATE_RFQ_MOCKS: MockEntry[] = [
  // GET /lbi/categories?scope=ALL
  { match: new RegExp('^/lbi/categories'), body: LBI_CATEGORIES },
  // GET /categories/:id/sub-categories
  {
    match: new RegExp('^/categories/\\d+/sub-categories'),
    body: [
      { sub_category_id: 301, name: 'ของเล่นแมว', sort_order: 1 },
      { sub_category_id: 302, name: 'ของเล่นสุนัข', sort_order: 2 },
    ],
  },
  // GET /rfqs/preview-factories?...
  { match: new RegExp('^/rfqs/preview-factories'), body: { match_count: 12, total: 12, count: 12 } },
];

// ═══════════════════════════════════════════════════════════════════════════
// Step 3: Product Detail — /product-detail?showcase_id=14
// FE calls: GET /showcases/14        (detail + embedded factory + reviews)
//           POST /showcases/14/view  (fire & forget)
//           GET /showcases?types=... (related products — listFiltered)
// ═══════════════════════════════════════════════════════════════════════════

const PRODUCT_MOCKS: MockEntry[] = [
  // GET /showcases/14 → returns showcase with embedded factory & reviews
  {
    match: '/showcases/14',
    body: {
      ...SHOWCASE_14,
      factory: {
        ...TOUR_FACTORY,
        verified: true,
      },
      reviews: {
        summary: {
          average: 4.85,
          total: 128,
          breakdown: { '5': 90, '4': 25, '3': 8, '2': 3, '1': 2 },
        },
        items: [
          {
            review_id: 'r1',
            reviewer_name: 'คุณสมชาย',
            rating: 5,
            comment: 'คุณภาพดีมาก สินค้าตรงตามที่สั่ง',
            created_at: '2026-04-10T12:00:00Z',
          },
          {
            review_id: 'r2',
            reviewer_name: 'คุณสมศรี',
            rating: 4,
            comment: 'ส่งตรงเวลา แต่บรรจุภัณฑ์ควรปรับปรุง',
            created_at: '2026-03-28T09:00:00Z',
          },
        ],
      },
    },
  },
  // POST /showcases/14/view — fire & forget
  { match: '/showcases/14/view', method: 'POST', body: { ok: true } },
  // GET /showcases?types=PD,PM,MT&... — related products
  { match: new RegExp('^/showcases\\?'), body: TOUR_SHOWCASES_LIST },
];

// ═══════════════════════════════════════════════════════════════════════════
// Step 4: Messages — /messages/9001
// FE calls: GET /conversations                    (list all)
//           GET /conversations/9001               (single detail)
//           GET /conversations/9001/messages       (message list)
//           POST /conversations/9001/mark-read    (mark as read)
// ═══════════════════════════════════════════════════════════════════════════

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
  // GET /conversations — list all
  { match: '/conversations', body: [TOUR_CONVERSATION] },
  // GET /conversations/9001 — single conversation detail
  { match: `/conversations/${TOUR_CONV_ID}`, body: TOUR_CONVERSATION },
  // GET /conversations/9001/messages?limit=50&offset=0
  { match: new RegExp(`^/conversations/${TOUR_CONV_ID}/messages`), body: TOUR_MESSAGES },
  // POST /conversations/9001/mark-read
  { match: `/conversations/${TOUR_CONV_ID}/mark-read`, method: 'POST', body: { ok: true } },
];

export const TOUR_MESSAGES_CONV_ID = TOUR_CONV_ID;

// ═══════════════════════════════════════════════════════════════════════════
// Step 5: RFQ Detail — /rfqs/28
// FE calls: GET /rfqs/28/detail  (bundle: rfq + quotations + quote_histories)
// ═══════════════════════════════════════════════════════════════════════════

const RFQ_28_BUNDLE = {
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
    budget_per_piece: 50,
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
  quotations: [
    {
      quote_id: 9101,
      quotation_id: 9101,
      rfq_id: 28,
      factory_id: TOUR_FACTORY.factory_id,
      factory_name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
      factory_image: TOUR_FACTORY.image_url,
      grand_total: 42000,
      price: 42000,
      unit_price: 420,
      lead_time_days: 8,
      lead_time: 8,
      rating: 4.9,
      verified: true,
      is_verified: true,
      recommended: true,
      ai_reason: 'ราคาคุ้มค่าที่สุด + งานไวสุด',
      status: 'PD',
      valid_until: '2026-06-15',
      created_at: '2026-04-28T10:00:00Z',
    },
    {
      quote_id: 9102,
      quotation_id: 9102,
      rfq_id: 28,
      factory_id: 9998,
      factory_name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
      grand_total: 38500,
      price: 38500,
      unit_price: 385,
      lead_time_days: 12,
      lead_time: 12,
      rating: 4.6,
      verified: false,
      is_verified: false,
      recommended: false,
      ai_reason: 'ราคาถูกที่สุด แต่ lead time นานกว่า',
      status: 'PD',
      valid_until: '2026-06-10',
      created_at: '2026-04-28T12:00:00Z',
    },
    {
      quote_id: 9103,
      quotation_id: 9103,
      rfq_id: 28,
      factory_id: 9997,
      factory_name: 'ของเล่นสัตว์เลี้ยง แฮปปี้',
      grand_total: 48000,
      price: 48000,
      unit_price: 480,
      lead_time_days: 7,
      lead_time: 7,
      rating: 4.8,
      verified: true,
      is_verified: true,
      recommended: false,
      ai_reason: 'ส่งเร็วที่สุด แต่ราคาสูงกว่า',
      status: 'PD',
      valid_until: '2026-06-12',
      created_at: '2026-04-28T14:00:00Z',
    },
  ],
  quote_histories: {},
};

const RFQ_MOCKS: MockEntry[] = [
  // GET /rfqs/28/detail → bundle (rfq + quotations + quote_histories)
  { match: '/rfqs/28/detail', body: RFQ_28_BUNDLE },
  // Fallback in case older code calls GET /rfqs/28 directly
  { match: '/rfqs/28', body: RFQ_28_BUNDLE },
];

// ═══════════════════════════════════════════════════════════════════════════
// Step 6: Order Detail — /orders/17
// FE calls: GET /orders/17     (order detail with nested production + rfq)
//           GET /wallet/me     (prefetch wallet balance)
// ═══════════════════════════════════════════════════════════════════════════

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
  quotation: {
    quotation_id: 9101,
    factory_id: TOUR_FACTORY.factory_id,
    factory_name: TOUR_FACTORY.factory_name,
    grand_total: 42000,
    unit_price: 420,
    lead_time_days: 8,
    status: 'AC',
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
  review_state: {
    eligible: false,
    has_review: false,
  },
};

const ORDER_MOCKS: MockEntry[] = [
  // GET /orders/17 — order detail with nested production, rfq, quotation
  { match: '/orders/17', body: ORDER_17 },
  // GET /wallet/me — prefetch for payment modal
  { match: '/wallet/me', body: { good_fund: 5000, pending_fund: 0 } },
];
