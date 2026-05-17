import { Input } from '@/components/ui/input';
/**
 * Step 1: สินค้าของคุณ
 *
 * 1) เลือกหมวดหมู่ (Visual Cards)
 * 2) เลือกประเภทย่อย (Radio buttons — จาก lbi_sub_categories)
 * 3) ชื่อสินค้า
 * 4) รายละเอียด (free text + smart placeholder ตาม sub-category)
 */
import React from 'react';
import { FileText, Sparkles, ChevronRight, Loader2 } from 'lucide-react';
import type { CreateRfqForm, SubCategory } from '@/components/features/create-rfq/types';
import {
  CATEGORY_ICONS,
  SUB_CATEGORY_PLACEHOLDERS,
  DEFAULT_PLACEHOLDER,
} from '@/components/features/create-rfq/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Category = { id: string; name: string };

type CreateRfqStep1Props = {
  form: CreateRfqForm;
  categories: Category[];
  subCategories: SubCategory[];
  subCategoriesLoading: boolean;
  subCategoriesError?: string | null;
  onRetrySubCategories?: () => void;
  onUpdate: <K extends keyof CreateRfqForm>(key: K, value: CreateRfqForm[K]) => void;
};

export function CreateRfqStep1({
  form,
  categories,
  subCategories,
  subCategoriesLoading,
  subCategoriesError,
  onRetrySubCategories,
  onUpdate,
}: CreateRfqStep1Props) {
  // Smart placeholder based on selected sub-category name
  const selectedSub = subCategories.find((s) => s.id === form.subCategoryId);
  const placeholder = selectedSub
    ? (SUB_CATEGORY_PLACEHOLDERS[selectedSub.name] ?? DEFAULT_PLACEHOLDER)
    : DEFAULT_PLACEHOLDER;

  return (
    <div className='flex flex-col gap-5'>
      {/* ── 1. หมวดหมู่สินค้า (Visual Cards) ── */}
      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <label className='text-[13px] font-bold text-gray-700 mb-3 block'>
          หมวดหมู่สินค้าที่ต้องการผลิต <span className='text-red-400'>*</span>
        </label>
        <div className='grid grid-cols-3 gap-2'>
          {categories.map((cat) => {
            const active = form.categoryId === cat.id;
            const icon = CATEGORY_ICONS[cat.id] ?? '📁';
            return (
              <Button
                variant='unstyled'
                key={cat.id}
                type='button'
                onClick={() => {
                  if (form.categoryId !== cat.id) {
                    onUpdate('categoryId', cat.id);
                    onUpdate('subCategoryId', ''); // reset sub-category
                  }
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  active
                    ? 'border-violet-500 bg-violet-50 shadow-sm'
                    : 'border-gray-100 bg-gray-50/50 active:scale-[0.97]'
                }`}
              >
                <span className='text-2xl leading-none'>{icon}</span>
                <span
                  className={`text-[10px] font-semibold leading-tight line-clamp-2 ${
                    active ? 'text-violet-700' : 'text-gray-600'
                  }`}
                >
                  {cat.name}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* ── 2. ประเภทย่อย (Radio buttons — จาก lbi_sub_categories) ── */}
      {form.categoryId && (
        <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
          <label className='text-[13px] font-bold text-gray-700 mb-1 flex items-center gap-1.5'>
            <ChevronRight size={14} className='text-violet-500' />
            ประเภทย่อย <span className='text-red-400'>*</span>
          </label>
          <p className='text-[10px] text-gray-400 mb-3'>
            เลือกให้ตรงเพื่อส่ง RFQ ไปถึงโรงงานที่เชี่ยวชาญ
          </p>

          {subCategoriesError ? (
            <div className='rounded-xl border border-red-100 bg-red-50 px-4 py-3 space-y-2'>
              <p className='text-[12px] text-red-700'>{subCategoriesError}</p>
              {onRetrySubCategories ? (
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => onRetrySubCategories()}
                  className='text-[12px] font-semibold text-violet-700 underline'
                >
                  ลองโหลดอีกครั้ง
                </Button>
              ) : null}
            </div>
          ) : subCategoriesLoading ? (
            <div className='flex items-center justify-center py-6 gap-2 text-gray-400'>
              <Loader2 size={16} className='animate-spin' />
              <span className='text-[12px]'>กำลังโหลด...</span>
            </div>
          ) : subCategories.length === 0 ? (
            <p className='text-[12px] text-gray-400 py-4 text-center'>ไม่พบประเภทย่อย</p>
          ) : (
            <div className='flex flex-col gap-1.5'>
              {subCategories.map((sub) => {
                const active = form.subCategoryId === sub.id;
                return (
                  <Button
                    variant='unstyled'
                    key={sub.id}
                    type='button'
                    onClick={() => onUpdate('subCategoryId', sub.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      active
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-100 bg-gray-50/50 active:scale-[0.98]'
                    }`}
                  >
                    {/* Radio dot */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        active ? 'border-violet-500' : 'border-gray-300'
                      }`}
                    >
                      {active && <div className='w-2.5 h-2.5 rounded-full bg-violet-500' />}
                    </div>
                    <span
                      className={`text-[13px] font-medium ${
                        active ? 'text-violet-800' : 'text-gray-600'
                      }`}
                    >
                      {sub.name}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 3. ชื่อสินค้า / โปรเจกต์ ── */}
      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <label className='text-[13px] font-bold text-gray-700 mb-2 flex items-center gap-1.5'>
          <FileText size={14} className='text-violet-500' />
          ชื่อสินค้าที่ต้องการผลิต <span className='text-red-400'>*</span>
        </label>
        <Input
          type='text'
          maxLength={100}
          value={form.title}
          onChange={(e) => onUpdate('title', e.target.value)}
          placeholder='เช่น อาหารแมวเกรดพรีเมียม สูตรลูกแมว'
          className='w-full bg-gray-50 border border-gray-200 text-gray-800 text-[14px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400'
        />
        <p className='text-[10px] text-gray-400 mt-1.5 text-right'>{form.title.length}/100</p>
      </div>

      {/* ── 4. รายละเอียดเพิ่มเติม (free text + smart placeholder) ── */}
      <div className='bg-white p-5 rounded-2xl shadow-sm border border-gray-100'>
        <label className='text-[13px] font-bold text-gray-700 mb-2 flex items-center gap-1.5'>
          <Sparkles size={14} className='text-amber-500' />
          รายละเอียดเพิ่มเติม
        </label>
        <Textarea
          value={form.details}
          onChange={(e) => onUpdate('details', e.target.value)}
          placeholder={placeholder}
          rows={5}
          className='w-full bg-gray-50 border border-gray-200 text-gray-800 text-[14px] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 placeholder:text-gray-400 resize-none'
        />
        <p className='text-[10px] text-gray-400 mt-1.5'>
          ยิ่งให้รายละเอียดมาก โรงงานยิ่งเสนอราคาได้แม่นยำ
        </p>
      </div>
    </div>
  );
}
