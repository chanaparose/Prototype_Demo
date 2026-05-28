import React, { useMemo, useState } from 'react';
import { useForm, type Path, type PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { showcasesApi, mediaApi } from '@/services/api/factoryApi';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { RelatedShowcasePicker } from '@/components/features/factory-portal/RelatedShowcasePicker';
import { mapLinkedShowcasesErrorToThai } from '@/utils/linkedShowcases';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { ShowcaseTypeSelector } from '@/components/factory/showcase/ShowcaseTypeSelector';
import {
  ShowcaseCategoryFields,
  ShowcaseImageManager,
  ShowcaseTypeBadge,
  type ShowcaseType,
} from '@/pages/factory-portal/components/ShowcaseFormShared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  showcaseFormEmptyValues,
  showcaseFormSchema,
  validateShowcasePublish,
  type ShowcaseContentType,
  type ShowcaseFormValues,
} from '@/domain/showcase/schemas/showcaseForm.schema';

export function FactoryShowcaseNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const myFactoryId = getFactoryEntityId(user);

  const contentType: ShowcaseType = (() => {
    const t = searchParams.get('type');
    return t === 'PM' || t === 'ID' || t === 'MT' ? t : 'PD';
  })();

  const { watch, setValue, getValues } = useForm<ShowcaseFormValues>({
    resolver: zodResolver(showcaseFormSchema),
    defaultValues: showcaseFormEmptyValues,
    mode: 'onSubmit',
  });
  const form = watch();
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedShowcaseIds, setSelectedShowcaseIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [linkedShowcaseError, setLinkedShowcaseError] = useState('');
  const [idScope, setIdScope] = useState<'PD' | 'MT'>('PD');
  const [pmScope, setPmScope] = useState<'PD' | 'MT'>('PD');

  const categoryScope: 'PD' | 'MT' =
    contentType === 'MT'
      ? 'MT'
      : contentType === 'ID'
        ? idScope
        : contentType === 'PM'
          ? pmScope
          : 'PD';
  const categoriesQ = useLbiCategoriesByScope(categoryScope);
  const selectedCategoryId = Number(form.category_id);
  const subIds = useMemo(
    () =>
      contentType !== 'MT' && Number.isFinite(selectedCategoryId) && selectedCategoryId > 0
        ? [selectedCategoryId]
        : [],
    [contentType, selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    Number.isFinite(selectedCategoryId) && selectedCategoryId > 0
      ? (subsResult.byCategory.get(selectedCategoryId) ?? [])
      : [];

  const setField = <K extends Path<ShowcaseFormValues>>(
    key: K,
    value: PathValue<ShowcaseFormValues, K>,
  ) => setValue(key, value);

  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
    setCropFile(file);
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const buildPayload = (
    status: 'DR' | 'AC',
    values: ShowcaseFormValues = getValues(),
  ): Record<string, unknown> => {
    const base = {
      content_type: contentType,
      status,
      title: values.title.trim(),
      excerpt: contentType !== 'ID' ? values.excerpt.trim() || undefined : undefined,
      content: values.content.trim() || undefined,
      image_url: imageUrls[0] ?? undefined,
      category_id: values.category_id ? Number(values.category_id) : undefined,
      sub_category_id: values.sub_category_id ? Number(values.sub_category_id) : undefined,
      lead_time_days: values.lead_time_days ? Number(values.lead_time_days) : undefined,
      linked_showcases: [...imageUrls, ...selectedShowcaseIds],
    };
    if (contentType === 'ID') return base;
    const withPrice = {
      ...base,
      moq: values.moq ? Number(values.moq) : undefined,
      base_price: values.base_price ? Number(values.base_price) : undefined,
    };
    if (contentType === 'PM') {
      return {
        ...withPrice,
        promo_price: values.promo_price ? Number(values.promo_price) : undefined,
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
      };
    }
    return withPrice;
  };

  const onSubmit = async (status: 'DR' | 'AC') => {
    const values = getValues();
    const publishError = validateShowcasePublish(values, {
      contentType: contentType as ShowcaseContentType,
      status,
      imageCount: imageUrls.length,
    });
    if (publishError) {
      setError(publishError);
      return;
    }
    setSaving(true);
    setError('');
    setLinkedShowcaseError('');
    try {
      await showcasesApi.create(
        buildPayload(status, values) as Parameters<typeof showcasesApi.create>[0],
      );

      navigate('/factory/showcases', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'สร้างไม่สำเร็จ';
      const linkedMsg = mapLinkedShowcasesErrorToThai(msg);
      if (linkedMsg) setLinkedShowcaseError(linkedMsg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const canPublish = form.title.trim().length > 0 && (contentType === 'ID' || imageUrls.length > 0);

  return (
    <div className='max-w-6xl mx-auto pb-28'>
      <div className='sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-gray-100 bg-white/95 px-4 backdrop-blur'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate('/factory/showcases')}
          className='flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors'
        >
          <ChevronLeft size={18} />
          กลับ
        </Button>

        <ShowcaseTypeBadge type={contentType} />

        <div className='flex items-center gap-2'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void onSubmit('DR')}
            disabled={saving}
            className='rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-50'
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
          </Button>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => void onSubmit('AC')}
            disabled={saving || !canPublish}
            className='rounded-lg px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-all disabled:opacity-50'
            style={{
              background:
                'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
            }}
          >
            {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
          </Button>
        </div>
      </div>

      <div className='px-4 py-5'>
        <ImageCropModal
          open={cropFile != null}
          file={cropFile}
          title='จัดตำแหน่งภาพ Showcase'
          // Lock crop frame to 4:3 for showcase uploader/editor consistency.
          aspect={4 / 3}
          outputWidth={1600}
          onCancel={() => setCropFile(null)}
          onConfirm={async (file) => {
            setUploading(true);
            setError('');
            setLinkedShowcaseError('');
            try {
              const up = await mediaApi.upload(file);
              const url = String(up.url ?? '').trim();
              if (url) setImageUrls((prev) => [...prev, url].slice(0, 5));
            } catch (e) {
              setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
            } finally {
              setUploading(false);
              setCropFile(null);
            }
          }}
        />

        {error ? <ErrorAlert>{error}</ErrorAlert> : null}

        <div className='grid auto-rows-min gap-5 lg:grid-cols-2'>
          {/* Image — col 1 */}
          {contentType !== 'ID' ? (
            <div>
              <ShowcaseImageManager
                imageUrls={imageUrls}
                uploading={uploading}
                onPickImage={(file) => void onPickImage(file)}
                onRemoveImage={(_, index) => removeImage(index)}
              />
            </div>
          ) : null}

          {/* Merged form fields — col 2 (or full-width for ID) */}
          <section
            className={`rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-5 ${
              contentType !== 'ID' ? 'lg:col-span-1' : 'lg:col-span-2'
            }`}
          >
            <div className='flex items-center justify-between gap-3 pb-3 border-b border-gray-100'>
              <p className='text-sm font-bold text-gray-800'>รายละเอียดสินค้า</p>
              <ShowcaseTypeBadge type={contentType} />
            </div>

            {/* ชื่อ */}
            <Label className='block'>
              <span className='text-xs text-gray-500 font-medium'>ชื่อ *</span>
              <Input
                className='mt-1 w-full text-base font-semibold text-gray-900 placeholder-gray-300 rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/50'
                placeholder='ชื่อสินค้า / ไอเดีย'
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
            </Label>

            {/* หมวดหมู่ */}
            <ShowcaseCategoryFields
              contentType={contentType}
              idScope={idScope}
              pmScope={pmScope}
              onIdScopeChange={(scope) => {
                setIdScope(scope);
                setField('category_id', '');
                setField('sub_category_id', '');
              }}
              onPmScopeChange={(scope) => {
                setPmScope(scope);
                setField('category_id', '');
                setField('sub_category_id', '');
              }}
              categoryValue={form.category_id ? Number(form.category_id) : null}
              subCategoryValue={form.sub_category_id ? Number(form.sub_category_id) : null}
              onCategoryChange={(value) =>
                setField('category_id', value != null ? String(value) : '')
              }
              onSubCategoryChange={(value) =>
                setField('sub_category_id', value != null ? String(value) : '')
              }
              categoriesQ={categoriesQ}
              subOptions={subOptions}
              subCategoriesLoading={subsResult.isLoading}
            />

            {/* ราคา / MOQ / Lead time */}
            {contentType !== 'ID' ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100'>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>ราคาเริ่มต้น (฿)</span>
                  <Input
                    type='number'
                    step='0.01'
                    placeholder='0.00'
                    className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
                    value={form.base_price}
                    onChange={(e) => setField('base_price', e.target.value)}
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>MOQ (ชิ้น)</span>
                  <Input
                    type='number'
                    placeholder='500'
                    className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
                    value={form.moq}
                    onChange={(e) => setField('moq', e.target.value)}
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>Lead time (วัน)</span>
                  <Input
                    type='number'
                    placeholder='30'
                    className='mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm'
                    value={form.lead_time_days}
                    onChange={(e) => setField('lead_time_days', e.target.value)}
                  />
                </Label>
              </div>
            ) : null}

            {/* โปรโมชัน extra fields */}
            {contentType === 'PM' ? (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dashed border-purple-100'>
                <Label className='block'>
                  <span className='text-xs font-medium text-indigo-600'>ราคาโปรโมชัน (฿) *</span>
                  <Input
                    type='number'
                    step='0.01'
                    placeholder='0.00'
                    className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-300 focus:outline-none'
                    value={form.promo_price}
                    onChange={(e) => setField('promo_price', e.target.value)}
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs font-medium text-indigo-600'>วันที่เริ่มโปร *</span>
                  <Input
                    type='date'
                    className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-300 focus:outline-none'
                    value={form.start_date}
                    onChange={(e) => setField('start_date', e.target.value)}
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs font-medium text-indigo-600'>วันที่สิ้นสุดโปร *</span>
                  <Input
                    type='date'
                    className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-300 focus:outline-none'
                    value={form.end_date}
                    onChange={(e) => setField('end_date', e.target.value)}
                  />
                </Label>
              </div>
            ) : null}
          </section>

          {/* Markdown — full width */}
          <section className='lg:col-span-3'>
            <MarkdownEditor
              label='รายละเอียด (Markdown)'
              value={form.content}
              onChange={(v) => setField('content', v)}
              minHeight={300}
            />
          </section>

           
          {contentType === 'ID' && myFactoryId != null ? (
            <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3'>
              <Label className='block text-sm font-semibold text-brand-navy'>
                อ้างอิงสินค้า / โปรโมชัน (ไม่บังคับ)
              </Label>
              <p className='text-xs text-gray-500'>
                เลือกสินค้าหรือโปรโมชันของโรงงานคุณที่เกี่ยวข้องกับไอเดียนี้ (สูงสุด 5 รายการ)
              </p>
              <RelatedShowcasePicker
                factoryId={myFactoryId}
                value={selectedShowcaseIds}
                onChange={setSelectedShowcaseIds}
                max={5}
                disabled={saving}
                errorText={linkedShowcaseError}
              />
            </section>
          ) : null}
        </div>
      </div>

    </div>
  );
}
