import React from 'react';
import { Camera, Plus, X } from 'lucide-react';
import type { UseQueryResult } from '@tanstack/react-query';
import { LookupSelect } from '@/components/common/LookupSelect';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image } from '@/components/ui/image';

export type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
export type ShowcaseScope = 'PD' | 'MT';
export type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';

const SHOWCASE_TYPE_META: Record<
  ShowcaseType,
  { icon: string; label: string; sub: string; cls: string }
> = {
  PD: {
    icon: '🏷',
    label: 'สินค้า',
    sub: 'Product Design',
    cls: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  PM: {
    icon: '🎁',
    label: 'โปรโมชัน',
    sub: 'Promotion',
    cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  ID: {
    icon: '💡',
    label: 'ไอเดีย',
    sub: 'Industrial Design',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  MT: {
    icon: '🧱',
    label: 'วัตถุดิบ',
    sub: 'Materials',
    cls: 'bg-green-50 text-green-700 border-green-200',
  },
};

type Option = { id: number; name: string };

export function ShowcaseTypeBadge({ type }: { type: ShowcaseType }) {
  const meta = SHOWCASE_TYPE_META[type] ?? SHOWCASE_TYPE_META.PD;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}
    >
      {meta.icon} {meta.label}
      <span className='opacity-60 hidden sm:inline'>· {meta.sub}</span>
    </span>
  );
}

export function ShowcaseImageManager({
  imageUrls,
  uploading,
  onPickImage,
  onRemoveImage,
}: {
  imageUrls: string[];
  uploading: boolean;
  onPickImage: (file: File | null) => void;
  onRemoveImage: (url: string, index: number) => void;
}) {
  const pick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    onPickImage(file);
  };

  return (
    <section className='w-full'>
      <div
        className='relative aspect-[4/3] rounded-xl overflow-hidden border'
        style={{ borderColor: '#E7E2F0', background: 'var(--neutral-warm-surface)' }}
      >
        {imageUrls[0] ? (
          <>
            <Image src={imageUrls[0]} alt='' className='w-full h-full object-cover' />
            <Button
              onClick={() => onRemoveImage(imageUrls[0], 0)}
              variant='neutral'
              size='icon-sm'
              className='absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10'
              aria-label='ลบภาพปก'
            >
              <X size={16} />
            </Button>
          </>
        ) : (
          <Label className='w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-400 hover:text-orange-500 transition-colors'>
            <Camera size={36} strokeWidth={1.5} />
            <span className='text-sm font-medium'>
              {uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดภาพปก'}
            </span>
            <span className='text-xs opacity-70'>PNG, JPG, WEBP · สูงสุด 5 รูป</span>
            <Input
              type='file'
              accept='image/*'
              className='hidden'
              disabled={uploading}
              onChange={pick}
            />
          </Label>
        )}
      </div>

      {imageUrls.length > 0 ? (
        <div className='flex gap-2 mt-2 flex-wrap'>
          {imageUrls.slice(1).map((url, i) => (
            <div
              key={`${url}-${i}`}
              className='relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0'
            >
              <Image src={url} alt='' className='w-full h-full object-cover' />
              <Button
                onClick={() => onRemoveImage(url, i + 1)}
                variant='neutral'
                size='icon-xs'
                className='absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center z-10'
                aria-label='ลบภาพ'
              >
                <X size={10} />
              </Button>
            </div>
          ))}
          {imageUrls.length < 5 ? (
            <Label className='w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange-300 hover:text-orange-500 shrink-0 transition-colors'>
              <Plus size={16} />
              <span className='text-[9px] mt-0.5'>เพิ่ม</span>
              <Input
                type='file'
                accept='image/*'
                className='hidden'
                disabled={uploading}
                onChange={pick}
              />
            </Label>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function ShowcaseCategoryFields({
  contentType,
  idScope,
  pmScope,
  onIdScopeChange,
  onPmScopeChange,
  categoryValue,
  subCategoryValue,
  onCategoryChange,
  onSubCategoryChange,
  categoriesQ,
  subOptions,
  subCategoriesLoading,
  statusValue,
  onStatusChange,
}: {
  contentType: ShowcaseType;
  idScope: ShowcaseScope;
  pmScope: ShowcaseScope;
  onIdScopeChange: (scope: ShowcaseScope) => void;
  onPmScopeChange: (scope: ShowcaseScope) => void;
  categoryValue: number | null;
  subCategoryValue: number | null;
  onCategoryChange: (value: number | null) => void;
  onSubCategoryChange: (value: number | null) => void;
  categoriesQ: UseQueryResult<Option[]>;
  subOptions: Option[];
  subCategoriesLoading?: boolean;
  statusValue?: ShowcaseStatus;
  onStatusChange?: (value: ShowcaseStatus) => void;
}) {
  const hideSubCat =
    contentType === 'MT' ||
    (contentType === 'ID' && idScope === 'MT') ||
    (contentType === 'PM' && pmScope === 'MT');

  const renderScopePicker = (
    label: string,
    value: ShowcaseScope,
    onChange: (scope: ShowcaseScope) => void,
  ) => (
    <div>
      <Label className='block text-sm font-medium text-gray-700 mb-1.5'>{label}</Label>
      <div className='flex gap-2'>
        {(['PD', 'MT'] as const).map((scope) => (
          <Button
            key={scope}
            onClick={() => onChange(scope)}
            variant={value === scope ? 'default' : 'secondary'}
            className='flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all'
            style={{
              backgroundColor: value === scope ? 'var(--brand-indigo)' : '#F8FAFC',
              color: value === scope ? 'var(--neutral-white)' : '#334155',
              borderColor: value === scope ? 'var(--brand-indigo)' : 'var(--neutral-slate-border)',
            }}
          >
            {scope === 'PD' ? '🏷 สินค้า' : '🧱 วัตถุดิบ'}
          </Button>
        ))}
      </div>
    </div>
  );

  return (
    <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
      <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>ข้อมูลหลัก</p>

      {contentType === 'ID' ? renderScopePicker('ประเภทเนื้อหา', idScope, onIdScopeChange) : null}
      {contentType === 'PM'
        ? renderScopePicker('ประเภทสินค้าที่โปรโมท', pmScope, onPmScopeChange)
        : null}

      <div
        className={`grid grid-cols-1 gap-3 ${hideSubCat ? (onStatusChange ? 'sm:grid-cols-2' : '') : onStatusChange ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}
      >
        <LookupSelect
          label='หมวดหมู่'
          value={categoryValue}
          onChange={(value) => {
            onCategoryChange(value);
            onSubCategoryChange(null);
          }}
          queryResult={categoriesQ}
          getId={(option) => option.id}
          getLabel={(option) => option.name}
          placeholder='เลือกหมวดหมู่'
          triggerClassName='text-xs'
          contentClassName='text-xs'
          itemClassName='text-xs'
        />

        {!hideSubCat ? (
          <Label className='block'>
            <span className='text-xs text-gray-500 mb-1.5 block'>หมวดหมู่ย่อย</span>
            <Select
              disabled={categoryValue == null || subCategoriesLoading}
              value={subCategoryValue != null ? String(subCategoryValue) : ''}
              onValueChange={(next) =>
                onSubCategoryChange(next === '__empty' ? null : Number(next))
              }
            >
              <SelectTrigger className='w-full h-10 text-xs disabled:bg-gray-50 disabled:text-gray-400'>
                <SelectValue
                  placeholder={
                    categoryValue == null
                      ? '— เลือกหมวดหมู่ก่อน —'
                      : subCategoriesLoading
                        ? 'กำลังโหลด…'
                        : '— เลือกหมวดย่อย —'
                  }
                />
              </SelectTrigger>
              <SelectContent className='text-xs'>
                <SelectItem value='__empty' className='text-xs'>
                  {categoryValue == null
                    ? '— เลือกหมวดหมู่ก่อน —'
                    : subCategoriesLoading
                      ? 'กำลังโหลด…'
                      : '— เลือกหมวดย่อย —'}
                </SelectItem>
                {subOptions.map((option) => (
                  <SelectItem key={option.id} value={String(option.id)} className='text-xs'>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Label>
        ) : null}

        {onStatusChange ? (
          <Label className='block'>
            <span className='text-xs text-gray-500 mb-1.5 block'>สถานะ</span>
            <Select
              value={statusValue ?? 'DR'}
              onValueChange={(next) => onStatusChange(next as ShowcaseStatus)}
            >
              <SelectTrigger className='w-full h-10 text-xs'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='text-xs'>
                <SelectItem value='DR' className='text-xs'>
                  ร่าง
                </SelectItem>
                <SelectItem value='AC' className='text-xs'>
                  Active
                </SelectItem>
                <SelectItem value='HI' className='text-xs'>
                  Hidden
                </SelectItem>
                <SelectItem value='AR' className='text-xs'>
                  เก็บเข้าคลัง
                </SelectItem>
              </SelectContent>
            </Select>
          </Label>
        ) : null}
      </div>
    </section>
  );
}
