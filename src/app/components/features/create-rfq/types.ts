export type CreateRfqForm = {
  /* Step 1: สินค้าของคุณ */
  categoryId: string; // → rfqs.category_id (FK → categories)
  subCategoryId: string; // → rfqs.sub_category_id (FK → lbi_sub_categories) ← ใหม่
  title: string; // → rfqs.title (varchar 100)
  details: string; // → rfqs.details (free text)

  /* Step 2: จำนวนและงบประมาณ */
  quantity: string; // → rfqs.quantity (bigint)
  unitId: string; // → rfqs.unit_id (FK → lbi_units)
  budgetPerPiece: string; // → rfqs.budget_per_piece (numeric 10,2)
  imageUrls: string[]; // → rfq_images (after create)

  /* Step 3: ที่อยู่จัดส่ง + วิธีจัดส่ง + ยืนยัน */
  addressId: string; // → rfqs.address_id (FK → addresses)
  shippingMethodId: string; // → rfqs.shipping_method_id (FK → lbi_shipping_methods) ← ใหม่
};

export const INITIAL_FORM: CreateRfqForm = {
  categoryId: '',
  subCategoryId: '',
  title: '',
  details: '',
  quantity: '',
  unitId: '1', // default: ชิ้น
  budgetPerPiece: '',
  imageUrls: [],
  addressId: '',
  shippingMethodId: '',
};

export type SubCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type Unit = {
  id: string;
  name: string;
};

export const FALLBACK_UNITS: Unit[] = [
  { id: '1', name: 'ชิ้น' },
  { id: '2', name: 'กล่อง' },
  { id: '3', name: 'กิโลกรัม' },
  { id: '4', name: 'แพ็ค' },
  { id: '5', name: 'ถุง' },
  { id: '6', name: 'ขวด' },
  { id: '7', name: 'แผ่น' },
];

export type ShippingMethod = {
  id: string;
  name: string;
};

export const FALLBACK_SHIPPING_METHODS: ShippingMethod[] = [
  { id: '1', name: 'ลูกค้ารับเองที่โรงงาน' },
  { id: '2', name: 'ขนส่งเอกชน' },
  { id: '3', name: 'ขนส่งหมู่บ้าน/ไปรษณีย์' },
  { id: '4', name: 'รถบรรทุกโรงงาน' },
];

export type Address = {
  id: string;
  addressDetail: string;
  subDistrict: string;
  district: string;
  province: string;
  zipCode: string;
  isDefault: boolean;
};

export const STEPS = ['สินค้าของคุณ', 'จำนวนและงบประมาณ', 'ที่อยู่และยืนยัน'] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  '1': '🐾', // อาหารสัตว์
  '2': '💊', // อาหารเสริม
  '3': '🧸', // ของเล่นสัตว์เลี้ยง
  '4': '👕', // เสื้อผ้าสัตว์เลี้ยง
  '5': '🎒', // อุปกรณ์สัตว์เลี้ยง
  '6': '📦', // บรรจุภัณฑ์
  '7': '🧴', // เครื่องสำอาง
  '8': '🧵', // เสื้อผ้า/สิ่งทอ
  '9': '🪑', // เฟอร์นิเจอร์
  '10': '🔧', // พลาสติก
  '11': '🦴', // ขนมสัตว์เลี้ยง
};

export const SHIPPING_ICONS: Record<string, string> = {
  '1': '🏭', // รับเองที่โรงงาน
  '2': '🚚', // ขนส่งเอกชน
  '3': '📮', // ขนส่งหมู่บ้าน/ไปรษณีย์
  '4': '🚛', // รถบรรทุกโรงงาน
};

export const SUB_CATEGORY_PLACEHOLDERS: Record<string, string> = {
  // อาหารสุนัข / แมว / สัตว์เล็ก
  อาหารสุนัข:
    'เช่น สูตรอะไร (Grain-free/High Protein), ช่วงวัย (Puppy/Adult/Senior), ขนาดเม็ด, มาตรฐาน (อย./GMP/HACCP)',
  อาหารแมว:
    'เช่น สูตร Indoor/Hairball, ช่วงวัย (Kitten/Adult/Senior), วัตถุดิบหลัก, มาตรฐาน (อย./GMP)',
  'อาหารนก/สัตว์เล็ก': 'เช่น ชนิดสัตว์ (นก/กระต่าย/หนูแฮมสเตอร์), สูตรอาหาร, ขนาดบรรจุ',
  // ขนม
  ขนมสุนัข: 'เช่น ชนิด (กระดูก/เนื้ออบแห้ง/Jerky), รสชาติ, ขนาด, มาตรฐาน',
  ขนมแมว: 'เช่น ชนิด (ขนมเลีย/ขนมเม็ด/Freeze-dried), รสชาติ, มาตรฐาน',
  // อาหารเสริม
  อาหารเสริมสุนัข: 'เช่น สรรพคุณ (บำรุงขน/ข้อ/ภูมิคุ้มกัน), รูปแบบ (เม็ด/ผง/น้ำ), มาตรฐาน',
  อาหารเสริมแมว: 'เช่น สรรพคุณ (บำรุงขน/ระบบย่อย/ไต), รูปแบบ (เม็ด/เจล), มาตรฐาน',
  // บรรจุภัณฑ์
  'ถุง/Pouch': 'เช่น ขนาด (กxยxส), วัสดุ (อลูมิเนียม/คราฟท์), ซิปล็อค, พิมพ์โลโก้, จำนวนสี',
  กล่องกระดาษ: 'เช่น ขนาด, ความหนากระดาษ (gsm), พิมพ์สี, เคลือบ',
  'ขวด/กระป๋อง': 'เช่น ขนาด (ml), วัสดุ (PET/HDPE/แก้ว), สี, ฝา',
  'ฉลาก/สติกเกอร์': 'เช่น ขนาด, วัสดุ (กระดาษ/PP/PVC), พิมพ์สี, เคลือบ',
  // เครื่องสำอาง
  'แชมพู/ครีมนวด': 'เช่น สูตร (ออร์แกนิค/กำจัดเห็บ/ผิวแพ้ง่าย), กลิ่น, ขนาดบรรจุ, มาตรฐาน',
  'สบู่/โฟมอาบน้ำ': 'เช่น สูตร, กลิ่น, รูปทรง, ขนาด, มาตรฐาน',
  'สเปรย์/โลชั่น': 'เช่น สรรพคุณ, กลิ่น, ขนาดบรรจุ, มาตรฐาน',
  // เฟอร์นิเจอร์
  'คอนโดแมว/ที่ลับเล็บ': 'เช่น จำนวนชั้น, ขนาด, วัสดุ (ไม้/ผ้า/เชือก), สี',
  'บ้าน/กรงสัตว์เลี้ยง': 'เช่น ขนาดสัตว์ (S/M/L), วัสดุ, สี, แบบพับได้หรือไม่',
};

export const DEFAULT_PLACEHOLDER =
  'อธิบายสิ่งที่คุณต้องการ เช่น\n• ขนาด / น้ำหนัก / สี\n• วัสดุ / ส่วนผสม\n• มาตรฐานที่ต้องการ\n• กำหนดส่งมอบ';
