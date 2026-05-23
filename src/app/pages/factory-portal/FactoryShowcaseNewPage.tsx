import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { showcasesApi } from '@/services/api/factoryApi';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
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
  type ShowcaseFormValues,
} from '@/domain/showcase/schemas/showcaseForm.schema';
import {
  buildShowcasePayload,
  useShowcaseCategoryOptions,
  validateShowcaseSubmission,
} from '@/pages/factory-portal/hooks/useShowcaseForm';
import {
  normalizeShowcaseType,
  type ShowcaseSubmitStatus,
} from '@/constants/showcase';
import { useFactoryShowcaseMutations } from '@/pages/factory-portal/hooks/useFactoryShowcaseMutations';

export function FactoryShowcaseNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const myFactoryId = getFactoryEntityId(user);

  const contentType: ShowcaseType = normalizeShowcaseType(searchParams.get('type'));

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
  const [error, setError] = useState('');
  const { createShowcase, uploadShowcaseImage } = useFactoryShowcaseMutations();
  const [linkedShowcaseError, setLinkedShowcaseError] = useState('');
  const selectedCategoryId = Number(form.category_id);
  const {
    idScope,
    pmScope,
    setIdScope,
    setPmScope,
    categoriesQ,
    subOptions,
    subsResult,
  } = useShowcaseCategoryOptions({
    contentType,
    selectedCategoryId:
      Number.isFinite(selectedCategoryId) && selectedCategoryId > 0 ? selectedCategoryId : null,
  });

  const setField = <K extends keyof ShowcaseFormValues>(key: K, value: ShowcaseFormValues[K]) =>
    setValue(key, value as never);

  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
    setCropFile(file);
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  const buildPayload = (
    status: ShowcaseSubmitStatus,
    values: ShowcaseFormValues = getValues(),
  ): Record<string, unknown> =>
    buildShowcasePayload({
      contentType,
      status,
      values,
      imageUrls,
      selectedShowcaseIds,
    });

  const onSubmit = async (status: ShowcaseSubmitStatus) => {
    const values = getValues();
    const publishError = validateShowcaseSubmission(values, {
      contentType,
      status,
      imageCount: imageUrls.length,
    });
    if (publishError) {
      setError(publishError);
      return;
    }
    setError('');
    setLinkedShowcaseError('');
    createShowcase.mutate(
      buildPayload(status, values) as Parameters<typeof showcasesApi.create>[0],
      {
        onSuccess: () => navigate('/factory/showcases', { replace: true }),
        onError: (err) => {
          const message =
            err instanceof Error ? err.message : 'สร้างไม่สำเร็จ';
          const linkedMsg = mapLinkedShowcasesErrorToThai(message);
          if (linkedMsg) setLinkedShowcaseError(linkedMsg);
          setError(message);
        },
      },
    );
  };

  const canPublish = form.title.trim().length > 0 && (contentType === 'ID' || imageUrls.length > 0);

  return (
    <div className='max-w-6xl mx-auto pb-28'>
      <div className='sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-3'>
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

        <Button
          variant='unstyled'
          type='button'
          onClick={() => void onSubmit('DR')}
          disabled={createShowcase.isPending}
          className='text-sm text-gray-600 font-medium hover:text-gray-900 disabled:opacity-40 transition-colors whitespace-nowrap'
        >
          บันทึกร่าง
        </Button>
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
            setError('');
            setLinkedShowcaseError('');
            uploadShowcaseImage.mutate(file, {
              onSuccess: (up) => {
                const url = String(up.url ?? '').trim();
                if (url) setImageUrls((prev) => [...prev, url].slice(0, 5));
                setCropFile(null);
              },
              onError: (err) =>
                setError(err instanceof Error ? err.message : 'อัปโหลดรูปไม่สำเร็จ'),
              onSettled: () => setUploading(false),
              onMutate: () => setUploading(true),
            });
          }}
        />

        {error ? <ErrorAlert>{error}</ErrorAlert> : null}

        <div className='space-y-5 min-w-0'>
          <div className='flex flex-col xl:flex-row xl:gap-5 xl:items-start gap-5'>
            {contentType !== 'ID' ? (
              <ShowcaseImageManager
                imageUrls={imageUrls}
                uploading={uploading}
                onPickImage={(file) => void onPickImage(file)}
                onRemoveImage={(_, index) => removeImage(index)}
              />
            ) : null}

            <div className='flex-1 min-w-0 space-y-5'>
              <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
                <ShowcaseTypeSelector value={contentType} onChange={() => undefined} disabled />
                <Input
                  className='w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35 rounded-lg transition-shadow'
                  placeholder='ชื่อ *'
                  value={form.title}
                  onChange={(e) => setField('title', e.target.value)}
                />
              </section>

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

              <section className='bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm'>
                {contentType !== 'ID' ? (
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
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

                {contentType === 'PM' ? (
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dashed border-purple-100'>
                    <Label className='block'>
                      <span className='text-xs font-medium text-indigo-600'>
                        ราคาโปรโมชัน (฿) *
                      </span>
                      <Input
                        type='number'
                        step='0.01'
                        placeholder='0.00'
                        className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none'
                        value={form.promo_price}
                        onChange={(e) => setField('promo_price', e.target.value)}
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs font-medium text-indigo-600'>วันที่เริ่มโปร *</span>
                      <Input
                        type='date'
                        className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none'
                        value={form.start_date}
                        onChange={(e) => setField('start_date', e.target.value)}
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs font-medium text-indigo-600'>
                        วันที่สิ้นสุดโปร *
                      </span>
                      <Input
                        type='date'
                        className='mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none'
                        value={form.end_date}
                        onChange={(e) => setField('end_date', e.target.value)}
                      />
                    </Label>
                  </div>
                ) : null}
              </section>
            </div>
          </div>

          <section>
            <MarkdownEditor
              label='รายละเอียด (Markdown)'
              value={form.content}
              onChange={(v) => setField('content', v)}
              minHeight={300}
            />
          </section>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
              <p className='text-sm font-semibold text-gray-900'>การเผยแพร่</p>
              <p className='mt-1 text-xs text-gray-500'>
                {contentType === 'ID'
                  ? 'กรอกชื่อและเนื้อหาให้ครบก่อนเผยแพร่'
                  : 'กรอกชื่อและอัปโหลดภาพปกก่อนเผยแพร่'}
              </p>
              <div className='mt-4 space-y-2'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void onSubmit('DR')}
                  disabled={createShowcase.isPending}
                  className='w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors'
                >
                  {createShowcase.isPending ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void onSubmit('AC')}
                  disabled={createShowcase.isPending || !canPublish}
                  className='w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm transition-all'
                  style={{
                    background:
                      'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                  }}
                >
                  {createShowcase.isPending ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
                </Button>
              </div>
            </div>

            <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
              <p className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>
                สถานะฟอร์ม
              </p>
              <div className='mt-3 space-y-2 text-sm text-gray-700'>
                <div className='flex items-center justify-between'>
                  <span>ชื่อรายการ</span>
                  <span
                    className={
                      form.title.trim()
                        ? 'text-emerald-600 font-semibold'
                        : 'text-amber-600 font-semibold'
                    }
                  >
                    {form.title.trim() ? 'พร้อม' : 'ยังไม่ครบ'}
                  </span>
                </div>
                {contentType !== 'ID' ? (
                  <div className='flex items-center justify-between'>
                    <span>ภาพปก</span>
                    <span
                      className={
                        imageUrls.length > 0
                          ? 'text-emerald-600 font-semibold'
                          : 'text-amber-600 font-semibold'
                      }
                    >
                      {imageUrls.length > 0 ? `${imageUrls.length}/5` : 'ยังไม่เพิ่ม'}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

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
                disabled={createShowcase.isPending}
                errorText={linkedShowcaseError}
              />
            </section>
          ) : null}
        </div>
      </div>

      <div className='fixed xl:hidden bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void onSubmit('DR')}
          disabled={createShowcase.isPending}
          className='flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors'
        >
          {createShowcase.isPending ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
        </Button>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void onSubmit('AC')}
          disabled={createShowcase.isPending || !canPublish}
          className='flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm active:scale-95 transition-all'
          style={{
            background:
              'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
          }}
        >
          {createShowcase.isPending ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
        </Button>
      </div>
    </div>
  );
}
