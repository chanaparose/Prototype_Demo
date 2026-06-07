export interface ProfileFormValues {
  image_url: string;
  /** รูปพื้นหลัง/แบนเนอร์หน้าโปรไฟล์โรงงาน (ถ้า BE รองรับ) */
  cover_image_url: string;
  factory_name: string;
  tax_id: string;
  description: string;
  category_ids: number[];
  sub_category_ids: number[];
  /** ระยะเวลาผลิตโดยประมาณแบบข้อความ (เช่น "15-20 วัน") */
  lead_time_desc: string;
}

export const PROFILE_FORM_DEFAULTS: ProfileFormValues = {
  image_url: '',
  cover_image_url: '',
  factory_name: '',
  tax_id: '',
  description: '',
  category_ids: [],
  sub_category_ids: [],
  lead_time_desc: '',
};
