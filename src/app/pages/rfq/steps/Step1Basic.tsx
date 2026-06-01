import React, { useRef, useState } from 'react';
import type { RFQDraft } from '@/pages/rfq/useRFQDraft';
import { mediaApi } from '@/services/api/factoryApi';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
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
  const [uploading, setUploading] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadOne = async (f: File) => {
    if (draft.reference_images.length >= 5) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(f);
      setDraft({ reference_images: [...draft.reference_images, res.url].slice(0, 5) });
    } finally {
      setUploading(false);
    }
  };

  const removeReference = (index: number) => {
    setDraft({ reference_images: draft.reference_images.filter((_, i) => i !== index) });
  };

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
    'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-normal text-brand-navy-deep placeholder:font-normal placeholder:text-neutral-placeholder data-[placeholder]:font-normal focus:border-brand-violet-deep focus:outline-none focus:ring-2 focus:ring-[rgba(109,40,217,0.10)]';
  return (
    <div className='space-y-4'>
      <div className='grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(240px,0.7fr)]'>
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
      <label className='block'>
        <span className='mb-1 block text-[11px] font-semibold text-brand-navy-deep'>
          รายละเอียด <span className='text-brand-orange-deep'>*</span>
        </span>
        <Textarea
          value={draft.description}
          onChange={(e) => setDraft({ description: e.target.value })}
          placeholder={descriptionPlaceholder}
          rows={4}
          className={`${fieldClass} min-h-[7rem] resize-y lg:min-h-[8.5rem]`}
        />
      </label>

      <div className='space-y-2'>
        <p className='text-[11px] font-semibold text-brand-navy-deep'>รูป / เอกสารอ้างอิง</p>
        <Input
          ref={fileInputRef}
          type='file'
          accept='image/*,.pdf'
          className='hidden'
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadOne(f);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
        />
        <Button
          variant='unstyled'
          type='button'
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || draft.reference_images.length >= 5}
          className='w-full rounded-xl border border-dashed border-brand-mauve-light/60 bg-white px-3 py-3 text-[12px] font-medium text-brand-violet-deep transition-colors hover:bg-brand-lavender-chip/40'
        >
          {uploading
            ? 'กำลังอัปโหลด...'
            : draft.reference_images.length >= 5
              ? 'ครบ 5 ไฟล์แล้ว'
              : `เพิ่มไฟล์ (${draft.reference_images.length}/5)`}
        </Button>
        {draft.reference_images.length > 0 ? (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {draft.reference_images.map((u, idx) => (
              <div
                key={u + idx}
                className='relative aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-100'
              >
                {!brokenImages[idx] ? (
                  <Image
                    src={u}
                    alt={`reference-${idx + 1}`}
                    className='h-full w-full object-cover'
                    onError={() => setBrokenImages((prev) => ({ ...prev, [idx]: true }))}
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-gray-600'>
                    เอกสารอ้างอิง #{idx + 1}
                  </div>
                )}
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => removeReference(idx)}
                  className='absolute right-1 top-1 h-6 w-6 rounded-full bg-black/60 text-xs leading-none text-white'
                  aria-label={`ลบไฟล์อ้างอิง ${idx + 1}`}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`grid gap-3 ${showSubCategory ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
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
    </div>
  );
}
