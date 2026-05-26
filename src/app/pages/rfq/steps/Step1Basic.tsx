import React from 'react';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

type SubCategory = {
  id: number;
  name: string;
  sortOrder?: number;
};

type Props = {
  draft: RFQDraft;
  setDraft: (next: Partial<RFQDraft>) => void;
  categories: { id: number; name: string }[];
  subCategories: SubCategory[];
  subCategoriesLoading?: boolean;
  mode?: 'PR' | 'PS' | 'MS' | 'MR';
};

export function Step1Basic({
  draft,
  setDraft,
  categories,
  subCategories,
  subCategoriesLoading = false,
  mode = 'PR',
}: Props) {
  const descriptionPlaceholder =
    mode === 'MS'
      ? 'ระบุชื่อวัตถุดิบ, เกรด, แหล่งที่มา, ขนาด pack (อย่างน้อย 20 ตัวอักษร) *'
      : mode === 'MR'
        ? 'ระบุวัตถุดิบที่ต้องการ, ปริมาณ, สเปก, มาตรฐาน *'
        : mode === 'PS'
          ? 'ระบุขนาด/สี/สูตร/มาตรฐานที่ต้องการ (อย่างน้อย 20 ตัวอักษร) *'
          : 'รายละเอียดงาน *';
  const showSubCategory = mode !== 'MS' && mode !== 'MR';
  const fieldClass =
    'w-full rounded-xl border border-gray-200 bg-[var(--neutral-warm-surface)]/50 px-3 py-2.5 text-sm text-brand-navy-deep placeholder:text-neutral-placeholder focus:border-brand-violet-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.12)]';
  return (
    <div className='space-y-3.5'>
      <label className='block'>
        <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>
          ชื่อโปรเจกต์ / สินค้า <span className='text-brand-orange-deep'>*</span>
        </span>
        <Input
          value={draft.title}
          onChange={(e) => setDraft({ title: e.target.value })}
          placeholder='เช่น ขวดพลาสติก 500ml'
          className={fieldClass}
        />
      </label>
      <label className='block'>
        <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>
          รายละเอียด <span className='text-brand-orange-deep'>*</span>
        </span>
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ description: e.target.value })}
          placeholder={descriptionPlaceholder}
          rows={3}
          className={`${fieldClass} min-h-[4.5rem] resize-y`}
        />
      </label>
      <div
        className={`grid gap-2.5 ${showSubCategory ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2'}`}
      >
        <label className='block min-w-0'>
          <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>
            หมวดหมู่ <span className='text-brand-orange-deep'>*</span>
          </span>
          <Select
          value={draft.category_id != null ? String(draft.category_id) : ''}
          onValueChange={(next) =>
            setDraft({
              category_id: next === '__empty' ? null : Number(next),
              sub_category_id: undefined,
            })
          }
        >
          <SelectTrigger className={fieldClass}>
            <SelectValue placeholder='เลือกหมวดหมู่' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='__empty'>หมวดหมู่ *</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </label>
        {showSubCategory ? (
          <label className='block min-w-0'>
            <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>หมวดย่อย</span>
          <Select
            value={draft.sub_category_id != null ? String(draft.sub_category_id) : ''}
            onValueChange={(next) =>
              setDraft({ sub_category_id: next === '__empty' ? undefined : Number(next) })
            }
            disabled={!draft.category_id || subCategoriesLoading}
          >
            <SelectTrigger className={`${fieldClass} disabled:bg-gray-100`}>
              <SelectValue
                placeholder={subCategoriesLoading ? 'กำลังโหลด…' : 'ไม่ระบุก็ได้'}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='__empty'>
                {subCategoriesLoading ? 'กำลังโหลดหมวดย่อย...' : 'หมวดย่อย (ไม่บังคับ)'}
              </SelectItem>
              {subCategories.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                  {s.sortOrder === 99 ? ' (ส่งทุกโรงงานในหมวดหลัก)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </label>
        ) : null}
        <label className='block min-w-0'>
          <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>
            จำนวน <span className='text-brand-orange-deep'>*</span>
          </span>
        <Input
          type='number'
          min={1}
          value={draft.qty ?? ''}
          onChange={(e) => setDraft({ qty: Number(e.target.value) || null })}
          placeholder={mode === 'PS' ? '1–10' : mode === 'MS' ? '1–5' : 'ชิ้น'}
          className={fieldClass}
        />
        </label>
      </div>
      <label className='block'>
        <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>งบประมาณโดยประมาณ</span>
      <Input
        type='number'
        min={0}
        value={draft.target_price ?? ''}
        onChange={(e) => setDraft({ target_price: Number(e.target.value) || undefined })}
        placeholder='บาท (ไม่บังคับ)'
        className={fieldClass}
      />
      </label>
    </div>
  );
}
