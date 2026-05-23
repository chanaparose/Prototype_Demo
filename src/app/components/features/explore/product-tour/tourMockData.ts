export const CREATE_RFQ_CATEGORIES = [
  'ของเล่นสัตว์เลี้ยง',
  'อาหารสัตว์',
  'เสื้อผ้าสัตว์เลี้ยง',
] as const;

export const CREATE_RFQ_FIELDS = [
  {
    label: 'ชื่อโปรเจกต์',
    placeholder: 'เช่น ของเล่นแมวยางธรรมชาติ',
    value: 'ของเล่นแมว MOQ 100 ชิ้น',
    filled: true,
  },
  {
    label: 'รายละเอียดสินค้า',
    placeholder: 'อธิบายสินค้าที่ต้องการผลิต...',
    value: 'ต้องการผลิตของเล่นแมวจากยางธรรมชาติ ปลอดภัยสำหรับสัตว์เลี้ยง ขนาด 5–8 ซม.',
    filled: true,
    multiline: true,
  },
  { label: 'จำนวนที่ต้องการ (ชิ้น)', placeholder: '100', value: '100', filled: true },
  { label: 'งบประมาณ (บาท)', placeholder: '10,000', value: '5,000', filled: true },
  {
    label: 'วัสดุที่ต้องการ',
    placeholder: 'เช่น ยางธรรมชาติ, พลาสติก ABS',
    value: 'ยางธรรมชาติปลอดสาร BPA',
    filled: true,
  },
] as const;

export const RFQ_OFFERS = [
  {
    name: 'โรงงานอาหารสัตว์เลี้ยงพรีเมี่ยม',
    price: 42000,
    leadTime: 8,
    rating: 4.9,
    verified: true,
    recommended: true,
    reason: 'ราคาคุ้มค่าที่สุด + งานไวสุด',
  },
  {
    name: 'แพ็กเกจจิ้งสัตว์เลี้ยง โปร',
    price: 38500,
    leadTime: 12,
    rating: 4.6,
    verified: false,
    recommended: false,
    reason: 'ราคาถูกที่สุด แต่ lead time นานกว่า',
  },
  {
    name: 'ของเล่นสัตว์เลี้ยง แฮปปี้',
    price: 48000,
    leadTime: 7,
    rating: 4.8,
    verified: true,
    recommended: false,
    reason: 'ส่งเร็วที่สุด แต่ราคาสูงกว่า',
  },
] as const;

export const ORDER_PAYMENT_ROWS = [
  ['ยอดรวม', '฿42,000', false],
  ['ชำระมัดจำแล้ว', '฿21,000 ✓', true],
  ['ยอดที่ต้องชำระ', '฿21,000', false],
] as const;

export const ORDER_TIMELINE = [
  {
    title: 'ยืนยันคำสั่งซื้อ',
    date: '15 ม.ค. 2569',
    status: 'done',
    desc: 'ชำระมัดจำและยืนยันแล้ว',
  },
  {
    title: 'จัดซื้อวัตถุดิบ',
    date: '18 ม.ค. 2569',
    status: 'done',
    desc: 'ไนลอนและหนังสังเคราะห์พร้อมแล้ว',
  },
  {
    title: 'เริ่มกระบวนการผลิต',
    date: '22 ม.ค. 2569',
    status: 'done',
    desc: 'ตัดเย็บและประกอบตามแบบ',
  },
  {
    title: 'Quality Check ครั้งที่ 1',
    date: '5 ก.พ. 2569',
    status: 'current',
    desc: 'ตรวจสอบความแข็งแรงของชิ้นงาน',
  },
  { title: 'บรรจุและติดฉลาก', date: '', status: 'pending', desc: '' },
  { title: 'QC ขั้นสุดท้ายและจัดส่ง', date: '', status: 'pending', desc: '' },
] as const;

export const PRODUCT_STATS = [
  ['ขั้นต่ำผลิต', '100 ชิ้น (MOQ)'],
  ['สถานที่ผลิต', '📍 กรุงเทพมหานคร'],
  ['เผยแพร่', '25 เม.ย. 2569'],
] as const;
