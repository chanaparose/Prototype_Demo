import { z } from 'zod';

const categorySelectionSchema = z.object({
  categoryIds: z.array(z.number().int().positive()).min(1, 'เลือกอย่างน้อย 1 หมวดหมู่'),
});

const subCategorySelectionSchema = z.object({
  subCategoryIds: z.array(z.number().int().positive()).min(1, 'เลือกอย่างน้อย 1 หมวดหมู่ย่อย'),
});

export function parseCategorySelection(ids: number[]) {
  return categorySelectionSchema.safeParse({ categoryIds: ids });
}

export function parseSubCategorySelection(ids: number[]) {
  return subCategorySelectionSchema.safeParse({ subCategoryIds: ids });
}
