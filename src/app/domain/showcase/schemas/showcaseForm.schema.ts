import { z } from 'zod';
import type { ShowcaseSubmitStatus, ShowcaseType } from '@/constants/showcase';

export const showcaseFormSchema = z.object({
  title: z.string().trim().min(1, 'กรุณากรอกชื่อ'),
  excerpt: z.string(),
  content: z.string(),
  category_id: z.string(),
  sub_category_id: z.string(),
  moq: z.string(),
  lead_time_days: z.string(),
  base_price: z.string(),
  promo_price: z.string(),
  start_date: z.string(),
  end_date: z.string(),
});

export type ShowcaseFormValues = z.infer<typeof showcaseFormSchema>;

export const showcaseFormEmptyValues: ShowcaseFormValues = {
  title: '',
  excerpt: '',
  content: '',
  category_id: '',
  sub_category_id: '',
  moq: '',
  lead_time_days: '',
  base_price: '',
  promo_price: '',
  start_date: '',
  end_date: '',
};

export type ShowcaseContentType = ShowcaseType;

export function validateShowcasePublish(
  values: ShowcaseFormValues,
  opts: {
    contentType: ShowcaseContentType;
    status: ShowcaseSubmitStatus;
    imageCount: number;
  },
): string | null {
  if (opts.status === 'DR') return null;

  if (opts.contentType !== 'ID' && opts.imageCount === 0) {
    return 'กรุณาอัปโหลดภาพปกอย่างน้อย 1 รูปก่อนเผยแพร่';
  }

  if (opts.contentType === 'PM') {
    if (!values.promo_price || Number(values.promo_price) <= 0) {
      return 'กรุณากรอกราคาโปรโมชัน (฿) ให้มากกว่า 0';
    }
    if (
      values.base_price &&
      Number(values.base_price) > 0 &&
      Number(values.promo_price) > Number(values.base_price)
    ) {
      return 'ราคาโปรโมชันต้องไม่มากกว่าราคาปกติ';
    }
    if (!values.start_date || !values.end_date) {
      return 'โปรโมชันต้องมีวันเริ่มและวันสิ้นสุด';
    }
    if (values.end_date < values.start_date) {
      return 'วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่ม';
    }
  }

  return null;
}
