// Mock data for the application

export interface Factory {
  id: string;
  name: string;
  image: string;
  verified: boolean;
  rating: number;
  lowMOQ: boolean;
  category: string;
  province: string;
  certifications: string[];
  hasDiscount?: boolean;
  priceTier?: 'low' | 'mid' | 'high';
  promotionText?: string;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  code?: string;
  validUntil?: string;
  image?: string;
}

export interface Order {
  id: string;
  orderId: string;
  productName: string;
  productImage: string;
  status: 'deposit' | 'production' | 'qc' | 'shipping' | 'completed' | 'pending_completed';
  currentStep: number;
  factoryName: string;
  dueDate: string;
}

export interface RFQ {
  id: string;
  title: string;
  quantity: number;
  budget: number;
  datePosted: string;
  bidCount: number;
  status: 'pending' | 'received';
}

export interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'withdrawal';
  description: string;
  amount: number;
  status: 'success' | 'pending' | 'failed';
  date: string;
}

export interface Review {
  id: string;
  customerName: string;
  brandName: string;
  review: string;
  rating: number;
}

export interface Job {
  id: string;
  productName: string;
  customerName: string;
  dueDate: string;
  status: 'molding' | 'packaging' | 'qc' | 'shipping';
  progress: number;
  imageUrl?: string;
}

export interface Quote {
  id: string;
  productName: string;
  quantity: number;
  quotedPrice: number;
  dateSent: string;
  status: 'pending' | 'accepted' | 'rejected';
  customerName: string;
}

export const mockFactories: Factory[] = [
  {
    id: '1',
    name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
    image: 'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=400',
    verified: true,
    rating: 4.9,
    lowMOQ: true,
    category: 'อาหารสัตว์',
    province: 'ปทุมธานี',
    certifications: ['GMP', 'HACCP', 'อย.'],
    hasDiscount: true,
    priceTier: 'mid',
    promotionText: '฿500 off Min. spend ฿5,000'
  },
  {
    id: '2',
    name: 'เสื้อผ้าสัตว์เลี้ยง สยาม',
    image: 'https://images.unsplash.com/photo-1684259499086-93cb3e555803?w=400',
    verified: true,
    rating: 4.8,
    lowMOQ: true,
    category: 'เสื้อผ้าสัตว์เลี้ยง',
    province: 'นนทบุรี',
    certifications: ['ISO 9001'],
    hasDiscount: true,
    priceTier: 'low',
    promotionText: '40% off Min. spend ฿3,000'
  },
  {
    id: '3',
    name: 'อาหารเสริม เฮลท์ตี้ แพ็ค',
    image: 'https://images.unsplash.com/photo-1688267224124-aa10a75ec732?w=400',
    verified: true,
    rating: 4.7,
    lowMOQ: false,
    category: 'อาหารเสริม',
    province: 'สมุทรปราการ',
    certifications: ['GMP', 'อย.'],
    hasDiscount: false,
    priceTier: 'high'
  },
  {
    id: '4',
    name: 'โรงงานแพ็กเกจจิ้งครบวงจร',
    image: 'https://images.unsplash.com/photo-1762529483684-04d6e86cdd46?w=400',
    verified: true,
    rating: 4.9,
    lowMOQ: true,
    category: 'แพ็กเกจจิ้ง',
    province: 'ปทุมธานี',
    certifications: ['ISO 9001', 'FSC'],
    hasDiscount: true,
    priceTier: 'mid',
    promotionText: '20% off ครั้งแรก'
  }
];

export const mockPromotions: Promotion[] = [
  {
    id: '1',
    title: 'ครึ่งเดือนนี้! ลดสูงสุด 50%',
    subtitle: "ใส่โค้ด 'LMMID' สั่งเลย",
    code: 'LMMID',
    validUntil: '31 มี.ค. 69'
  },
  {
    id: '2',
    title: '1 ฟรี 1! สินค้าแนะนำ',
    subtitle: 'เพียง 209.- ตั้งแต่วันนี้',
    code: 'BOGO209',
    validUntil: '31 มี.ค. 69'
  },
  {
    id: '3',
    title: 'สั่งร้านใหม่ ลด 50.-',
    subtitle: "ใส่โค้ด 'EATNEW' รับส่วนลด",
    code: 'EATNEW',
    validUntil: '31 มี.ค. 69'
  }
];

/** Order id สอดคล้องกับ ChatConversation id: Order 1 <-> Chat 1, Order 2 <-> Chat 2, ... */
export const mockOrders: Order[] = [
  {
    id: '1',
    orderId: 'ORD-2026-001',
    productName: 'ขนมแมวเลีย รสปลาทูน่า',
    productImage: 'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=400',
    status: 'production',
    currentStep: 2,
    factoryName: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
    dueDate: '2026-03-15'
  },
  {
    id: '2',
    orderId: 'ORD-2026-002',
    productName: 'ขนมสุนัข Freeze Dried',
    productImage: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=400',
    status: 'qc',
    currentStep: 3,
    factoryName: 'เสื้อผ้าสัตว์เลี้ยง สยาม',
    dueDate: '2026-03-10'
  },
  {
    id: '3',
    orderId: 'ORD-2026-003',
    productName: 'ขนมแมวเลีย รสแซลมอน',
    productImage: 'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=400',
    status: 'completed',
    currentStep: 4,
    factoryName: 'อาหารเสริม เฮลท์ตี้ แพ็ค',
    dueDate: '2026-02-20'
  },
  {
    id: '4',
    orderId: 'ORD-2026-004',
    productName: 'ขนมแมวเลีย รสชีส',
    productImage: 'https://images.unsplash.com/photo-1579784340946-55a7bbd51d57?w=400',
    status: 'pending_completed',
    currentStep: 4,
    factoryName: 'โรงงานแพ็กเกจจิ้งครบวงจร',
    dueDate: '2026-02-20'
  }
];

export const mockRFQs: RFQ[] = [
  {
    id: '1',
    title: 'ต้องการผลิตอกไก่อบแห้ง',
    quantity: 200,
    budget: 15000,
    datePosted: '2026-02-14',
    bidCount: 3,
    status: 'received'
  },
  {
    id: '2',
    title: 'ขนมสุนัข Freeze Dried',
    quantity: 500,
    budget: 25000,
    datePosted: '2026-02-13',
    bidCount: 2,
    status: 'received'
  },
  {
    id: '3',
    title: 'เสื้อสุนัขขนาดกลาง',
    quantity: 100,
    budget: 8000,
    datePosted: '2026-02-15',
    bidCount: 0,
    status: 'pending'
  }
];

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'payment',
    description: 'ชำระมัดจำงวดที่ 1 (50%) - ขนมแมวเลีย',
    amount: -15000,
    status: 'success',
    date: '2026-02-10 14:30'
  },
  {
    id: '2',
    type: 'payment',
    description: 'ชำระมัดจำงวดที่ 1 (50%) - ขนมสุนัข',
    amount: -12500,
    status: 'success',
    date: '2026-02-08 10:15'
  },
  {
    id: '3',
    type: 'refund',
    description: 'คืนเงินค่ามัดจำ - ยกเลิกคำสั่งซื้อ',
    amount: 5000,
    status: 'success',
    date: '2026-02-05 16:20'
  }
];

export const mockReviews: Review[] = [
  {
    id: '1',
    customerName: 'คุณสมชาย',
    brandName: 'Pawsome Treats',
    review: 'สั่งทำขนมแมวเลีย 500 ซอง งานดี ส่งไวมาก คุณภาพเกินคาด',
    rating: 5
  },
  {
    id: '2',
    customerName: 'คุณนภา',
    brandName: 'Happy Paws',
    review: 'โรงงานดูแลดีมาก มีรูปอัปเดตความคืบหน้าทุกขั้นตอน',
    rating: 5
  },
  {
    id: '3',
    customerName: 'คุณวิชัย',
    brandName: 'Pet Nutrition Pro',
    review: 'ราคาดี MOQ ต่ำ เหมาะกับแบรนด์เริ่มต้น',
    rating: 4.5
  }
];

export const mockJobs: Job[] = [
  {
    id: '1',
    productName: 'ขนมแมวเลีย รสปลาทูน่า 500 ซอง',
    customerName: 'คุณสมชาย (Pawsome Treats)',
    dueDate: '2026-03-15',
    status: 'molding',
    progress: 45,
    imageUrl: 'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=400'
  },
  {
    id: '2',
    productName: 'ขนมสุนัข Freeze Dried 300 แพ็ค',
    customerName: 'คุณนภา (Happy Paws)',
    dueDate: '2026-03-20',
    status: 'packaging',
    progress: 70,
    imageUrl: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=400'
  }
];

export const mockQuotes: Quote[] = [
  {
    id: '1',
    productName: 'อกไก่อบแห้ง 200 ถุง',
    quantity: 200,
    quotedPrice: 14500,
    dateSent: '2026-02-14',
    status: 'pending',
    customerName: 'คุณวิชัย'
  },
  {
    id: '2',
    productName: 'ขนมสุนัข Freeze Dried 500 แพ็ค',
    quantity: 500,
    quotedPrice: 23000,
    dateSent: '2026-02-13',
    status: 'accepted',
    customerName: 'คุณนภา'
  },
  {
    id: '3',
    productName: 'เสื้อผ้าสัตว์เลี้ยง 100 ตัว',
    quantity: 100,
    quotedPrice: 7800,
    dateSent: '2026-02-12',
    status: 'rejected',
    customerName: 'คุณสุดา'
  }
];

export const mockNewRFQs: RFQ[] = [
  {
    id: '4',
    title: 'ต้องการผลิตขนมสุนัข Freeze Dried',
    quantity: 200,
    budget: 20000,
    datePosted: '2026-02-16',
    bidCount: 0,
    status: 'pending'
  },
  {
    id: '5',
    title: 'ขนมแมว รสแซลมอน 300 ซอง',
    quantity: 300,
    budget: 18000,
    datePosted: '2026-02-16',
    bidCount: 1,
    status: 'pending'
  }
];

// --- Customer Profile & Wallet (สำหรับ ProfileScreen, TransactionScreen) ---
export interface CustomerProfile {
  displayName: string;
  email: string;
  initial: string;
  projectCount: number;
  successCount: number;
  inProgressCount: number;
  savedFactoriesCount: number;
  addressCount: number;
  appVersion: string;
  buildNumber: string;
}

export const mockCustomerProfile: CustomerProfile = {
  displayName: 'คุณสมชาย',
  email: 'somchai@email.com',
  initial: 'สม',
  projectCount: 12,
  successCount: 8,
  inProgressCount: 4,
  savedFactoriesCount: 5,
  addressCount: 2,
  appVersion: '1.0.0',
  buildNumber: '12',
};

export const mockCustomerWalletBalance = 5000;

// --- RFQ Price Comparison (สำหรับ PriceComparisonScreen) ---
export interface RFQComparisonQuote {
  id: string;
  factoryName: string;
  factoryId?: string;
  pricePerUnit: number;
  moldCost: number;
  productionTime: string;
  details: string;
  rating: number;
  isWinner: boolean;
  totalPrice: number;
}

export const mockRFQQuotesByRfqId: Record<string, RFQComparisonQuote[]> = {
  '1': [
    { id: '1', factoryName: 'โรงงาน A - Pathum Pet Food', factoryId: '1', pricePerUnit: 30, moldCost: 5000, productionTime: '15 วัน', details: 'รวมแพ็กเกจจิ้ง, มาตรฐาน GMP', rating: 4.8, isWinner: true, totalPrice: 20500 },
    { id: '2', factoryName: 'โรงงาน B - Bangkok Pet Treats', factoryId: '2', pricePerUnit: 28, moldCost: 8000, productionTime: '30 วัน', details: 'ไม่รวมแพ็กเกจจิ้ง', rating: 4.2, isWinner: false, totalPrice: 22000 },
    { id: '3', factoryName: 'โรงงาน C - Samut Food Factory', factoryId: '3', pricePerUnit: 32, moldCost: 4000, productionTime: '20 วัน', details: 'รวมแพ็กเกจจิ้ง พรีเมี่ยม', rating: 4.5, isWinner: false, totalPrice: 20000 },
  ],
  '2': [
    { id: '1', factoryName: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม', factoryId: '1', pricePerUnit: 46, moldCost: 3000, productionTime: '14 วัน', details: 'รวมแพ็กเกจจิ้ง Freeze Dried', rating: 4.9, isWinner: true, totalPrice: 23300 },
    { id: '2', factoryName: 'โรงงานอาหารเสริม เฮลท์ตี้ แพ็ค', factoryId: '3', pricePerUnit: 48, moldCost: 5000, productionTime: '21 วัน', details: 'มาตรฐาน GMP, อย.', rating: 4.7, isWinner: false, totalPrice: 25100 },
  ],
};

// --- RFQ Detail Extended (สำหรับ RFQDetailScreen) ---
export interface RFQDetailExtended {
  productName: string;
  imageUrl: string;
  description: string;
  requirements: string[];
  location: string;
  targetFactory: string;
  budgetPerUnit?: number;
  totalBudget?: number;
  seenCount: number;
  quotedCount: number;
}

export const mockRFQDetailsByRfqId: Record<string, RFQDetailExtended> = {
  '1': {
    productName: 'อกไก่อบแห้ง',
    imageUrl: 'https://images.unsplash.com/photo-1645623383208-84926ba8aa21?w=800',
    description: 'ต้องการผลิตอกไก่อบแห้งสำหรับสัตว์เลี้ยง บรรจุถุง 50g',
    requirements: ['ต้องมีใบรับรอง อย.', 'โรงงานมีมาตรฐาน GMP', 'ส่งตัวอย่างก่อนผลิตจริง'],
    location: 'กรุงเทพมหานคร',
    targetFactory: 'โรงงานมาตรฐาน GMP, เขตปทุมธานี',
    budgetPerUnit: 75,
    totalBudget: 15000,
    seenCount: 12,
    quotedCount: 3,
  },
  '2': {
    productName: 'ขนมสุนัข Freeze Dried',
    imageUrl: 'https://images.unsplash.com/photo-1598134493179-51332e56807f?w=800',
    description: 'ต้องการขนมสุนัขฟรีซดราย สูตรตับไก่แท้ ไม่เค็ม ไม่มีสารกันเสีย บรรจุถุงซิปล็อค ขนาด 50g/ถุง',
    requirements: ['ต้องมีใบรับรอง อย.', 'โรงงานมีมาตรฐาน GMP', 'ส่งตัวอย่างก่อนผลิตจริง', 'รับประกันคุณภาพ'],
    location: 'กรุงเทพมหานคร',
    targetFactory: 'โรงงานมาตรฐาน GMP, เขตปทุมธานี',
    budgetPerUnit: 50,
    totalBudget: 25000,
    seenCount: 15,
    quotedCount: 2,
  },
  '3': {
    productName: 'เสื้อสุนัขขนาดกลาง',
    imageUrl: 'https://images.unsplash.com/photo-1684259499086-93cb3e555803?w=800',
    description: 'ต้องการผลิตเสื้อสุนัขขนาดกลาง 100 ตัว หลายสี',
    requirements: ['ผ้าคุณภาพดี', 'มี 4 สีขึ้นไป', 'รับ sample ก่อนผลิต'],
    location: 'นนทบุรี',
    targetFactory: 'โรงงานเสื้อผ้าสัตว์เลี้ยง',
    budgetPerUnit: 80,
    totalBudget: 8000,
    seenCount: 8,
    quotedCount: 0,
  },
};

// --- Chat (สอดคล้องกับโรงงาน + คำสั่งซื้อ) ---
export interface ChatMessage {
  id: string;
  sender: 'customer' | 'factory';
  text: string;
  at: string;
}

export interface ChatQuotationItem {
  name: string;
  unitPrice: number;
  quantity: number;
  total: number;
  note?: string;
}

export interface ChatQuotation {
  id: string;
  items: ChatQuotationItem[];
  subtotal: number;
  depositPercent: number;
  depositAmount: number;
}

export interface ChatConversation {
  id: string;
  factoryId: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
  messages: ChatMessage[];
  quotation?: ChatQuotation;
}

/** ChatConversation id สอดคล้องกับ Order id: Chat 1 <-> Order 1, Chat 2 <-> Order 2, ... */
export const mockChatConversations: ChatConversation[] = [
  {
    id: '1',
    factoryId: '1',
    lastMessage: 'ขอบคุณครับ ยืนยันรายการได้เลย',
    lastAt: '2026-02-21 14:30',
    unreadCount: 2,
    messages: [
      { id: 'm1', sender: 'factory', text: 'สวัสดีครับคุณลูกค้า ทางโรงงานได้รับคำขอผลิตสินค้าของท่านแล้วครับ', at: '2026-02-21 10:00' },
      { id: 'm2', sender: 'customer', text: 'สวัสดีครับ ผมสนใจผลิตขนมแมวเลีย 500 ซอง ใช้เวลานานไหมครับ', at: '2026-02-21 10:32' },
      { id: 'm3', sender: 'factory', text: 'ใช้เวลาประมาณ 15 วันครับ ผมส่งใบเสนอราคาให้พิจารณานะครับ', at: '2026-02-21 10:35' },
      { id: 'm4', sender: 'customer', text: 'โอเค สั่ง 500 ซอง พร้อมแพ็กเกจจิ้งแบบซิปครับ', at: '2026-02-21 14:00' },
      { id: 'm4b', sender: 'factory', text: 'ขอบคุณครับ ยืนยันรายการได้เลย', at: '2026-02-21 14:30' }
    ],
    quotation: {
      id: 'QT-2026-001',
      items: [
        { name: 'ค่าผลิตขนมแมวเลีย (500 ชิ้น)', unitPrice: 30, quantity: 500, total: 15000 },
        { name: 'ค่าแม่พิมพ์ (Mold Cost)', unitPrice: 5000, quantity: 1, total: 5000, note: 'จ่ายครั้งเดียว' },
        { name: 'ค่าจัดส่ง', unitPrice: 500, quantity: 1, total: 500 }
      ],
      subtotal: 20500,
      depositPercent: 50,
      depositAmount: 10250
    }
  },
  {
    id: '2',
    factoryId: '2',
    lastMessage: 'ส่งตัวอย่างสีให้ดูภายในพรุ่งนี้ครับ',
    lastAt: '2026-02-21 09:45',
    unreadCount: 1,
    messages: [
      { id: 'm5', sender: 'customer', text: 'อยากสั่งเสื้อสุนัขขนาดกลาง 100 ตัว มีสีอื่นนอกจากดำไหมครับ', at: '2026-02-20 16:00' },
      { id: 'm6', sender: 'factory', text: 'มีครับ มี 4 สี น้ำเงิน แดง น้ำตาล ดำ ส่งตัวอย่างสีให้ดูภายในพรุ่งนี้ครับ', at: '2026-02-21 09:45' }
    ]
  },
  {
    id: '3',
    factoryId: '3',
    lastMessage: 'ใบเสนอราคาส่งในแชทแล้วครับ',
    lastAt: '2026-02-20 11:20',
    unreadCount: 0,
    messages: [
      { id: 'm7', sender: 'customer', text: 'สอบถามผลิตอาหารเสริมแมว แบบเม็ด อย. รับไหมครับ', at: '2026-02-19 14:00' },
      { id: 'm8', sender: 'factory', text: 'รับครับ เรามี GMP และ อย. ครับ', at: '2026-02-19 15:30' },
      { id: 'm9', sender: 'customer', text: 'ขอใบเสนอราคา 300 กระปุกครับ', at: '2026-02-20 10:00' },
      { id: 'm10', sender: 'factory', text: 'ใบเสนอราคาส่งในแชทแล้วครับ', at: '2026-02-20 11:20' }
    ],
    quotation: {
      id: 'QT-2026-002',
      items: [
        { name: 'อาหารเสริมแมวแบบเม็ด อย. (300 กระปุก)', unitPrice: 85, quantity: 300, total: 25500 },
        { name: 'ค่าจัดส่ง', unitPrice: 800, quantity: 1, total: 800 }
      ],
      subtotal: 26300,
      depositPercent: 50,
      depositAmount: 13150
    }
  },
  {
    id: '4',
    factoryId: '4',
    lastMessage: 'ได้ครับ รบกวนส่งไฟล์ Artwork มาได้เลย',
    lastAt: '2026-02-18 16:00',
    unreadCount: 0,
    messages: [
      { id: 'm11', sender: 'customer', text: 'ต้องการทำกล่องแพ็กเกจจิ้งขนม 500 กล่อง พร้อมพิมพ์ลายได้ไหมครับ', at: '2026-02-18 09:00' },
      { id: 'm12', sender: 'factory', text: 'ได้ครับ รบกวนส่งไฟล์ Artwork มาได้เลย', at: '2026-02-18 16:00' }
    ]
  }
];
