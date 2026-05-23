import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { ChevronLeft } from 'lucide-react';

import { mediaApi, showcasesApi } from '@/services/api/factoryApi';
import { useEditForm } from '@/hooks/forms/useEditForm';
import { useBeforeUnload } from '@/hooks/forms/useBeforeUnload';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { FormSkeleton } from '@/components/common/FormSkeleton';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { useAuth } from '@/stores/useAuthStore';
import { getFactoryEntityId } from '@/utils/factoryUser';
import { RelatedShowcasePicker } from '@/components/features/factory-portal/RelatedShowcasePicker';
import { mapLinkedShowcasesErrorToThai, partitionLinkedShowcases } from '@/utils/linkedShowcases';
import { ImageCropModal } from '@/components/common/ImageCropModal';
import { ShowcaseTypeSelector } from '@/components/factory/showcase/ShowcaseTypeSelector';
import {
  ShowcaseCategoryFields,
  ShowcaseImageManager,
  ShowcaseTypeBadge,
  type ShowcaseStatus,
  type ShowcaseType,
} from '@/pages/factory-portal/components/ShowcaseFormShared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showcaseKeys } from '@/lib/queryKeys';
import {
  buildShowcasePayload,
  useShowcaseCategoryOptions,
  validateShowcaseSubmission,
} from '@/pages/factory-portal/hooks/useShowcaseForm';
import { useConfirmDialog } from '@/shared/ui/modals/ConfirmDialog';

interface ShowcaseFormValues {
  content_type: ShowcaseType;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  image_urls: string[];
  category_id: number | null;
  sub_category_id: number | null;
  moq: number | null;
  lead_time_days: number | null;
  base_price: number | null;
  promo_price: number | null;
  start_date: string;
  end_date: string;
  status: 'DR' | 'AC' | 'HI' | 'AR';
  related_showcase_ids: number[];
}

const DEFAULTS: ShowcaseFormValues = {
  content_type: 'PD',
  title: '',
  excerpt: '',
  content: '',
  image_url: '',
  image_urls: [],
  category_id: null,
  sub_category_id: null,
  moq: null,
  lead_time_days: null,
  base_price: null,
  promo_price: null,
  start_date: '',
  end_date: '',
  status: 'DR',
  related_showcase_ids: [],
};

type Raw = Record<string, unknown>;

function unwrapShowcasePayload(raw: Record<string, unknown>): Record<string, unknown> {
  const inner = raw.showcase;
  if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
  const data = raw.data;
  if (data && typeof data === 'object' && ('showcase_id' in data || 'id' in data)) {
    return data as Record<string, unknown>;
  }
  return raw;
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * One image entry — `id` is present when the image already exists in the
 * `factory_showcase_images` table (loaded from server). Newly added images
 * uploaded in this session start with `id: undefined` until they're persisted
 * via `addImage` (or saved as part of the `linked_showcases` legacy storage).
 */
type ImageEntry = { url: string; id?: number };

function parseImageEntries(raw: unknown): ImageEntry[] {
  const src = Array.isArray(raw)
    ? raw
    : typeof raw === 'string' && raw.trim().startsWith('[')
      ? (() => {
          try {
            const p = JSON.parse(raw) as unknown;
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
  return src
    .map((item): ImageEntry | null => {
      if (typeof item === 'string') {
        const url = item.trim();
        return url ? { url } : null;
      }
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const url = String(row.url ?? row.image_url ?? row.public_url ?? '').trim();
      if (!url) return null;
      const idRaw = row.image_id ?? row.id;
      const idNum = idRaw != null ? Number(idRaw) : NaN;
      return Number.isFinite(idNum) && idNum > 0 ? { url, id: idNum } : { url };
    })
    .filter((e): e is ImageEntry => e != null)
    .slice(0, 5);
}

function mapShowcaseToForm(raw: Raw): ShowcaseFormValues {
  const r = raw ?? {};
  const ct = String(r.content_type ?? 'PD').toUpperCase();
  const image_entries = parseImageEntries(r.images ?? r.image_urls ?? r.imageUrls);
  const linked = partitionLinkedShowcases(r.linked_showcases ?? r.linkedShowcases);
  const mergedImageUrls =
    image_entries.length > 0 ? image_entries.map((e) => e.url) : linked.imageUrls;
  const rawImageUrl = String(r.image_url ?? '').trim();
  const image_url =
    mergedImageUrls[0] ?? (/^https?:\/\//i.test(rawImageUrl) ? rawImageUrl : '');
  return {
    content_type: (ct === 'PM' || ct === 'ID' || ct === 'MT' ? ct : 'PD') as ShowcaseType,
    title: String(r.title ?? '').trim(),
    excerpt: String(r.excerpt ?? '').trim(),
    content: String(r.content ?? '').trim(),
    image_url,
    image_urls: mergedImageUrls,
    category_id: numOrNull(r.category_id),
    sub_category_id: numOrNull(r.sub_category_id),
    moq: numOrNull(r.moq ?? r.min_order),
    lead_time_days: numOrNull(r.lead_time_days),
    base_price: numOrNull(r.base_price ?? r.price),
    promo_price: numOrNull(r.promo_price ?? r.special_price),
    start_date: String(r.start_date ?? '').slice(0, 10),
    end_date: String(r.end_date ?? '').slice(0, 10),
    status: (['DR', 'AC', 'HI', 'AR'].includes(String(r.status))
      ? String(r.status)
      : 'DR') as ShowcaseFormValues['status'],
    related_showcase_ids: linked.showcaseIds.slice(0, 5),
  };
}

export function FactoryShowcaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [cropFile, setCropFile] = React.useState<File | null>(null);
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [persistedImageIdByUrl, setPersistedImageIdByUrl] = React.useState<Record<string, number>>(
    {},
  );
  const [selectedShowcaseIds, setSelectedShowcaseIds] = React.useState<number[]>([]);
  const [linkedShowcaseError, setLinkedShowcaseError] = React.useState('');
  const didHydrateFromServerRef = React.useRef(false);

  React.useEffect(() => {
    didHydrateFromServerRef.current = false;
  }, [id]);

  const removeImage = useCallback(
    async (urlToRemove: string) => {
      // Optimistic UI
      setImageUrls((prev) => prev.filter((u) => u !== urlToRemove));

      const imageId = persistedImageIdByUrl[urlToRemove];
      if (!id || !Number.isFinite(imageId) || imageId <= 0) return;

      try {
        await showcasesApi.deleteImage(id, imageId);
        setPersistedImageIdByUrl((prev) => {
          const next = { ...prev };
          delete next[urlToRemove];
          return next;
        });
      } catch (e) {
        // Revert on failure
        setImageUrls((prev) =>
          prev.includes(urlToRemove) ? prev : [...prev, urlToRemove].slice(0, 5),
        );
        setError(e instanceof Error ? e.message : 'ลบรูปไม่สำเร็จ');
      }
    },
    [id, persistedImageIdByUrl],
  );

  const { form, isLoading, isError, refetch } = useEditForm<ShowcaseFormValues, Raw>({
    queryKey: showcaseKeys.detail(id ?? ''),
    queryFn: async () => {
      const raw = await showcasesApi.get(id!);
      const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      return unwrapShowcasePayload(row);
    },
    mapper: mapShowcaseToForm,
    defaults: DEFAULTS,
    onReady: (values) => {
      if (didHydrateFromServerRef.current) return;
      didHydrateFromServerRef.current = true;
      const next = values.image_urls?.length
        ? values.image_urls
        : values.image_url
          ? [values.image_url]
          : [];
      setImageUrls(next.slice(0, 5));
      setSelectedShowcaseIds((values.related_showcase_ids ?? []).slice(0, 5));
    },
    enabled: Boolean(id),
  });

  useBeforeUnload(form.formState.isDirty);

  const selectedCategoryId = form.watch('category_id');
  const contentType = form.watch('content_type');
  const backPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (typeof from === 'string' && from.startsWith('/factory/showcases')) return from;
    return `/factory/showcases?type=${contentType}`;
  }, [location.state, contentType]);

  const {
    idScope,
    pmScope,
    setIdScope,
    setPmScope,
    categoriesQ,
    subOptions,
    subsResult,
  } = useShowcaseCategoryOptions({ contentType, selectedCategoryId });

  React.useEffect(() => {
    if (!id) return;
    let active = true;
    void showcasesApi
      .listImages(id)
      .then((rows) => {
        if (!active) return;
        const arr = (Array.isArray(rows) ? rows : []) as Record<string, unknown>[];
        const map: Record<string, number> = {};
        for (const r of arr) {
          const imageId = Number(r.image_id ?? r.id ?? 0);
          const url = String(r.image_url ?? r.url ?? '').trim();
          if (Number.isFinite(imageId) && imageId > 0 && url) map[url] = imageId;
        }
        setPersistedImageIdByUrl(map);
      })
      .catch(() => {
        if (active) setPersistedImageIdByUrl({});
      });
    return () => {
      active = false;
    };
  }, [id]);

  const save = useCallback(
    async (submitStatus: 'DR' | 'AC') => {
      if (!id) return;
      const v = form.getValues();
      const validationError = validateShowcaseSubmission(v, {
        contentType: v.content_type,
        status: submitStatus,
        imageCount: imageUrls.length,
        requireTitle: true,
      });
      if (validationError) {
        setError(validationError);
        return;
      }
      setSaving(true);
      setError('');
      setLinkedShowcaseError('');
      const payload = buildShowcasePayload({
        contentType: v.content_type,
        status: submitStatus,
        values: v,
        imageUrls,
        selectedShowcaseIds,
      });

      try {
        await showcasesApi.update(id, payload);
        const existingRaw = await showcasesApi.listImages(id).catch(() => []);
        const existing = (Array.isArray(existingRaw) ? existingRaw : [])
          .map((r) => {
            const row = (r ?? {}) as Record<string, unknown>;
            const imageId = Number(row.image_id ?? row.id ?? 0);
            const imageUrl = String(row.image_url ?? row.url ?? '').trim();
            const sortOrder = Number(row.sort_order ?? 0);
            if (!Number.isFinite(imageId) || imageId <= 0 || !imageUrl) return null;
            return { imageId, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 };
          })
          .filter((x): x is { imageId: number; imageUrl: string; sortOrder: number } => x != null);

        const desiredUrls = imageUrls.slice(0, 5);
        const desiredSet = new Set(desiredUrls);
        const existingSet = new Set(existing.map((x) => x.imageUrl));

        await Promise.all(
          existing
            .filter((x) => !desiredSet.has(x.imageUrl))
            .map((x) => showcasesApi.deleteImage(id, x.imageId).catch(() => undefined)),
        );

        await Promise.all(
          desiredUrls
            .filter((url) => !existingSet.has(url))
            .map((url, idx) =>
              showcasesApi
                .addImage(id, { image_url: url, sort_order: idx + 1 })
                .catch(() => undefined),
            ),
        );

        const refreshedRaw = await showcasesApi.listImages(id).catch(() => []);
        const refreshed = (Array.isArray(refreshedRaw) ? refreshedRaw : [])
          .map((r) => {
            const row = (r ?? {}) as Record<string, unknown>;
            const imageId = Number(row.image_id ?? row.id ?? 0);
            const imageUrl = String(row.image_url ?? row.url ?? '').trim();
            const sortOrder = Number(row.sort_order ?? 0);
            if (!Number.isFinite(imageId) || imageId <= 0 || !imageUrl) return null;
            return { imageId, imageUrl, sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0 };
          })
          .filter((x): x is { imageId: number; imageUrl: string; sortOrder: number } => x != null);

        await Promise.all(
          desiredUrls.map((url, idx) => {
            const row = refreshed.find((x) => x.imageUrl === url);
            if (!row) return Promise.resolve();
            const nextSort = idx + 1;
            if (row.sortOrder === nextSort) return Promise.resolve();
            return showcasesApi
              .updateImage(id, row.imageId, { sort_order: nextSort })
              .catch(() => undefined);
          }),
        );

        await Promise.all([
          qc.invalidateQueries({ queryKey: showcaseKeys.detail(id) }),
          qc.invalidateQueries({ queryKey: showcaseKeys.lists() }),
        ]);
        navigate(backPath, { replace: true });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ';
        const linkedMsg = mapLinkedShowcasesErrorToThai(msg);
        if (linkedMsg) setLinkedShowcaseError(linkedMsg);
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [id, form, qc, imageUrls, selectedShowcaseIds, navigate, backPath],
  );

  const onBack = useCallback(async () => {
    if (form.formState.isDirty) {
      const ok = await confirm({
        title: 'ออกจากหน้านี้?',
        description: 'มีข้อมูลที่ยังไม่บันทึก หากออกจากหน้านี้ การเปลี่ยนแปลงจะไม่ถูกบันทึก',
        confirmText: 'ออกจากหน้า',
        destructive: true,
      });
      if (!ok) return;
    }
    navigate(backPath);
  }, [backPath, confirm, form.formState.isDirty, navigate]);

  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
    setCropFile(file);
  };

  const titleValue = form.watch('title');
  const canPublish =
    (titleValue ?? '').trim().length > 0 && (contentType === 'ID' || imageUrls.length > 0);

  if (!id || fid == null) return null;
  if (isError) {
    return (
      <div className='py-12 text-center'>
        <p className='text-sm text-red-600 mb-3'>โหลดไม่สำเร็จ</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void refetch()}
          className='px-4 py-2 rounded-xl border text-sm'
        >
          ลองใหม่
        </Button>
      </div>
    );
  }
  if (isLoading) return <FormSkeleton sections={4} />;

  return (
    <form
      className='max-w-6xl mx-auto w-full min-w-0 pb-28'
      style={{ backgroundColor: 'var(--brand-page)' }}
    >
      <div className='sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void onBack()}
          className='flex items-center gap-1.5 text-sm font-medium transition-colors'
          style={{ color: 'var(--brand-indigo)' }}
        >
          <ChevronLeft size={18} /> กลับ
        </Button>

        <ShowcaseTypeBadge type={contentType} />

        <Button
          variant='unstyled'
          type='button'
          onClick={() => void save('DR')}
          disabled={saving}
          className='text-sm font-semibold disabled:opacity-40 transition-colors whitespace-nowrap'
          style={{ color: 'var(--brand-indigo)' }}
        >
          บันทึกร่าง
        </Button>
      </div>

      <div className='px-4 py-5'>
        <ConfirmDialog />
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
            try {
              const up = await mediaApi.upload(file);
              const url = String(up.url ?? '').trim();
              if (!url) return;
              setImageUrls((prev) => [...prev, url].slice(0, 5));
            } catch (e) {
              setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
            } finally {
              setUploading(false);
              setCropFile(null);
            }
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
                onRemoveImage={(url) => void removeImage(url)}
              />
            ) : null}

            <div className='flex-1 min-w-0 space-y-5'>
              <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
                <ShowcaseTypeSelector value={contentType} onChange={() => undefined} disabled />
                <Input
                  className='w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35 rounded-lg transition-shadow'
                  placeholder='ชื่อ *'
                  {...form.register('title', { required: true })}
                />
              </section>

              <ShowcaseCategoryFields
                contentType={contentType}
                idScope={idScope}
                pmScope={pmScope}
                onIdScopeChange={(scope) => {
                  setIdScope(scope);
                  form.setValue('category_id', null, { shouldDirty: true });
                  form.setValue('sub_category_id', null, { shouldDirty: true });
                }}
                onPmScopeChange={(scope) => {
                  setPmScope(scope);
                  form.setValue('category_id', null, { shouldDirty: true });
                  form.setValue('sub_category_id', null, { shouldDirty: true });
                }}
                categoryValue={selectedCategoryId}
                subCategoryValue={form.watch('sub_category_id')}
                onCategoryChange={(value) => {
                  form.setValue('category_id', value, { shouldDirty: true });
                  form.setValue('sub_category_id', null, { shouldDirty: true });
                }}
                onSubCategoryChange={(value) =>
                  form.setValue('sub_category_id', value, { shouldDirty: true })
                }
                categoriesQ={categoriesQ}
                subOptions={subOptions}
                subCategoriesLoading={subsResult.isLoading}
                statusValue={form.watch('status')}
                onStatusChange={(value: ShowcaseStatus) =>
                  form.setValue('status', value, { shouldDirty: true })
                }
              />

              <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
                {contentType !== 'ID' && (
                  <div className='grid gap-3 sm:grid-cols-3'>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>MOQ</span>
                      <Input
                        type='number'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('moq', {
                          setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>Lead time (วัน)</span>
                      <Input
                        type='number'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('lead_time_days', {
                          setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>ราคา (฿)</span>
                      <Input
                        type='number'
                        step='0.01'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('base_price', {
                          setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                      />
                    </Label>
                  </div>
                )}

                {contentType === 'PM' && (
                  <div className='grid gap-3 sm:grid-cols-3'>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>ราคาโปรโมชัน (฿)</span>
                      <Input
                        type='number'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('promo_price', {
                          setValueAs: (v) => (v === '' ? null : Number(v)),
                        })}
                        placeholder='0.00'
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>วันที่เริ่มโปร</span>
                      <Input
                        type='date'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('start_date')}
                      />
                    </Label>
                    <Label className='block'>
                      <span className='text-xs text-gray-500 mb-1.5 block'>วันที่สิ้นสุดโปร</span>
                      <Input
                        type='date'
                        className='w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-brand-indigo focus:ring-1 focus:ring-indigo- outline-none'
                        {...form.register('end_date')}
                      />
                    </Label>
                  </div>
                )}
              </section>
            </div>
          </div>

          <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4'>
            <p className='text-[10px] font-semibold text-gray-400 uppercase tracking-wide'>
              รายละเอียด
            </p>
            <Controller
              control={form.control}
              name='content'
              render={({ field }) => (
                <MarkdownEditor
                  label='รายละเอียด (Markdown)'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  minHeight={300}
                  disabled={form.getValues('status') === 'AR'}
                />
              )}
            />
          </section>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='rounded-2xl border border-gray-100 bg-white p-4 shadow-sm'>
              <p className='text-sm font-semibold text-gray-900'>การเผยแพร่</p>
              <p className='mt-1 text-xs text-gray-500'>
                อัปเดตข้อมูลแล้วกดเผยแพร่เพื่อให้หน้าลูกค้าเห็นข้อมูลล่าสุด
              </p>
              <div className='mt-4 space-y-2'>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void save('DR')}
                  disabled={saving}
                  className='w-full py-2.5 rounded-xl border text-sm font-semibold disabled:opacity-50 transition-colors'
                  style={{ borderColor: 'var(--brand-indigo)', color: 'var(--brand-indigo)' }}
                >
                  บันทึกร่าง
                </Button>
                <Button
                  variant='unstyled'
                  type='button'
                  onClick={() => void save('AC')}
                  disabled={saving || !canPublish}
                  className='w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm'
                  style={{
                    background:
                      'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
                  }}
                >
                  เผยแพร่
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
                      (titleValue ?? '').trim()
                        ? 'text-emerald-600 font-semibold'
                        : 'text-amber-600 font-semibold'
                    }
                  >
                    {(titleValue ?? '').trim() ? 'พร้อม' : 'ยังไม่ครบ'}
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

          {contentType === 'ID' ? (
            <section className='rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3'>
              <Label className='block text-sm font-semibold text-brand-navy'>
                อ้างอิงสินค้า / โปรโมชัน (ไม่บังคับ)
              </Label>
              <p className='text-xs text-gray-500'>
                เลือกสินค้าหรือโปรโมชันของโรงงานคุณที่เกี่ยวข้องกับไอเดียนี้ (สูงสุด 5 รายการ)
              </p>
              <RelatedShowcasePicker
                factoryId={fid}
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

      <div className='sticky xl:hidden bottom-0 z-10 bg-white border-t border-gray-100 px-4 py-3 flex gap-3'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void save('DR')}
          disabled={saving}
          className='flex-1 py-3 rounded-xl border text-sm font-semibold disabled:opacity-50 transition-colors'
          style={{ borderColor: 'var(--brand-indigo)', color: 'var(--brand-indigo)' }}
        >
          บันทึกร่าง
        </Button>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void save('AC')}
          disabled={saving || !canPublish}
          className='flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm'
          style={{
            background:
              'linear-gradient(135deg, var(--brand-indigo) 0%, var(--brand-indigo-dark) 100%)',
          }}
        >
          เผยแพร่
        </Button>
      </div>
    </form>
  );
}
