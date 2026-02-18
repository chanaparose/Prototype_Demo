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
}

export interface Order {
  id: string;
  orderId: string;
  productName: string;
  productImage: string;
  status: 'deposit' | 'production' | 'qc' | 'shipping' | 'completed';
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
    certifications: ['GMP', 'HACCP', 'อย.']
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
    certifications: ['ISO 9001']
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
    certifications: ['GMP', 'อย.']
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
    certifications: ['ISO 9001', 'FSC']
  }
];

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
    factoryName: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
    dueDate: '2026-03-10'
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
