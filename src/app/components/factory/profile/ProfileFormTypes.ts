export interface ProfileFormValues {
  image_url: string;
  /** รูปพื้นหลัง/แบนเนอร์หน้าโปรไฟล์โรงงาน (ถ้า BE รองรับ) */
  cover_image_url: string;
  factory_name: string;
  tax_id: string;
  description: string;
  factory_type_id: number | null;
  category_ids: number[];
  sub_category_ids: number[];
  /** ขั้นต่ำในการรับผลิต (ชิ้น) — แสดงในหน้า factory profile ของลูกค้า */
  min_order: number | null;
  /** ระยะเวลาผลิตโดยประมาณแบบข้อความ (เช่น "15-20 วัน") */
  lead_time_desc: string;
}

export const PROFILE_FORM_DEFAULTS: ProfileFormValues = {
  image_url: '',
  cover_image_url: '',
  factory_name: '',
  tax_id: '',
  description: '',
  factory_type_id: null,
  category_ids: [],
  sub_category_ids: [],
  min_order: null,
  lead_time_desc: '',
};
