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
  mode?: 'PR' | 'PS' | 'MS';
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
      : mode === 'PS'
        ? 'ระบุขนาด/สี/สูตร/มาตรฐานที่ต้องการ (อย่างน้อย 20 ตัวอักษร) *'
        : 'รายละเอียดงาน *';
  const showSubCategory = mode !== 'MS';
  return (
    <div className='space-y-3'>
      <Input
        value={draft.title}
        onChange={(e) => setDraft({ title: e.target.value })}
        placeholder='ชื่อสินค้า *'
        className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
      <Textarea
        value={draft.description}
        onChange={(e) => setDraft({ description: e.target.value })}
        placeholder={descriptionPlaceholder}
        rows={4}
        className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
      <div className={`${showSubCategory ? 'grid grid-cols-3' : 'grid grid-cols-2'} gap-2`}>
        <Select
          value={draft.category_id ?? ''}
          onValueChange={(next) =>
            setDraft({
              category_id: next === '__empty' ? null : Number(next),
              sub_category_id: undefined,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder='หมวดหมู่ *' />
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
        {showSubCategory ? (
          <Select
            value={draft.sub_category_id ?? ''}
            onValueChange={(next) =>
              setDraft({ sub_category_id: next === '__empty' ? undefined : Number(next) })
            }
            disabled={!draft.category_id || subCategoriesLoading}
          >
            <SelectTrigger className='disabled:bg-gray-100'>
              <SelectValue
                placeholder={subCategoriesLoading ? 'กำลังโหลดหมวดย่อย...' : 'หมวดย่อย (ไม่บังคับ)'}
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
        ) : null}
        <Input
          type='number'
          min={1}
          value={draft.qty ?? ''}
          onChange={(e) => setDraft({ qty: Number(e.target.value) || null })}
          placeholder='จำนวน *'
          className='rounded-xl border border-gray-200 px-3 py-2 text-sm'
        />
      </div>
      <Input
        type='number'
        min={0}
        value={draft.target_price ?? ''}
        onChange={(e) => setDraft({ target_price: Number(e.target.value) || undefined })}
        placeholder='งบประมาณรวม'
        className='w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
      />
    </div>
  );
}
