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
import { useLbiCategoriesByScope } from '@/hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '@/hooks/master/useSubCategoriesByCategory';
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
  type ShowcaseType,
} from '@/pages/factory-portal/components/ShowcaseFormShared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { masterApi } from '@/services/api/masterApi';
import { UnitPicker, type UnitOption } from '@/pages/rfq/steps/UnitPicker';
import {
  factoryButtonClass,
  factoryCardClass,
  factoryInputClass,
} from '@/pages/factory-portal/factoryUi';

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
  unit_id: number | null;
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
  unit_id: null,
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

/** Backward-compat helper for places that only need URL strings. */
function parseImageUrls(raw: unknown): string[] {
  return parseImageEntries(raw).map((e) => e.url);
}

function mapShowcaseToForm(raw: Raw): ShowcaseFormValues {
  const r = raw ?? {};
  const ct = String(r.content_type ?? 'PD').toUpperCase();
  const image_entries = parseImageEntries(r.images ?? r.image_urls ?? r.imageUrls);
  const linked = partitionLinkedShowcases(r.linked_showcases ?? r.linkedShowcases);
  const mergedImageUrls =
    image_entries.length > 0 ? image_entries.map((e) => e.url) : linked.imageUrls;
  const rawImageUrl = String(r.image_url ?? '').trim();
  const image_url = mergedImageUrls[0] ?? (/^https?:\/\//i.test(rawImageUrl) ? rawImageUrl : '');
  return {
    content_type: (ct === 'PM' || ct === 'ID' || ct === 'MT' ? ct : 'PD') as ShowcaseType,
    title: String(r.title ?? '').trim(),
    excerpt: String(r.excerpt ?? '').trim(),
    content: String(r.content ?? '').trim(),
    image_url,
    image_urls: mergedImageUrls,
    category_id: numOrNull(r.category_id),
    sub_category_id: numOrNull(r.sub_category_id),
    unit_id: numOrNull(r.unit_id),
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
  const [units, setUnits] = React.useState<UnitOption[]>([]);
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
    queryKey: ['showcase', id] as const,
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

  const [idScope, setIdScope] = React.useState<'PD' | 'MT'>('PD');
  const [pmScope, setPmScope] = React.useState<'PD' | 'MT'>('PD');

  const selectedCategoryId = form.watch('category_id');
  const contentType = form.watch('content_type');
  const backPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (typeof from === 'string' && from.startsWith('/factory/showcases')) return from;
    return `/factory/showcases?type=${contentType}`;
  }, [location.state, contentType]);

  const categoryScope: 'PD' | 'MT' =
    contentType === 'MT'
      ? 'MT'
      : contentType === 'ID'
        ? idScope
        : contentType === 'PM'
          ? pmScope
          : 'PD';
  const categoriesQ = useLbiCategoriesByScope(categoryScope);
  const pdCategoriesQ = useLbiCategoriesByScope('PD');
  const mtCategoriesQ = useLbiCategoriesByScope('MT');

  const subIds = useMemo(
    () => (contentType !== 'MT' && selectedCategoryId != null ? [selectedCategoryId] : []),
    [contentType, selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    selectedCategoryId != null ? (subsResult.byCategory.get(selectedCategoryId) ?? []) : [];

  // Auto-adjust scope for ID/PM edit forms so existing category_id from API is visible
  // even when it belongs to MT while default scope starts at PD.
  React.useEffect(() => {
    if (selectedCategoryId == null) return;

    const pdIds = new Set((pdCategoriesQ.data ?? []).map((c) => c.id));
    const mtIds = new Set((mtCategoriesQ.data ?? []).map((c) => c.id));

    if (contentType === 'ID') {
      if (mtIds.has(selectedCategoryId) && idScope !== 'MT') {
        setIdScope('MT');
      } else if (pdIds.has(selectedCategoryId) && idScope !== 'PD') {
        setIdScope('PD');
      }
      return;
    }

    if (contentType === 'PM') {
      if (mtIds.has(selectedCategoryId) && pmScope !== 'MT') {
        setPmScope('MT');
      } else if (pdIds.has(selectedCategoryId) && pmScope !== 'PD') {
        setPmScope('PD');
      }
    }
  }, [selectedCategoryId, contentType, idScope, pmScope, pdCategoriesQ.data, mtCategoriesQ.data]);

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

  React.useEffect(() => {
    let active = true;
    void masterApi
      .getUnits()
      .then((raw) => {
        if (!active) return;
        const list: unknown[] = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as Record<string, unknown>)?.data)
            ? ((raw as Record<string, unknown>).data as unknown[])
            : [];
        setUnits(
          (list as Record<string, unknown>[])
            .map((u) => ({
              unit_id: Number(u.unit_id ?? u.id ?? 0),
              name_th: String(u.name_th ?? u.unit_name_th ?? u.unit_name ?? u.name ?? ''),
              name_en: String(u.name_en ?? u.unit_name ?? u.name ?? ''),
              code: String(u.code ?? u.abbreviation ?? ''),
              group_th: String(u.group_th ?? 'อื่นๆ'),
              group_en: String(u.group_en ?? 'Other'),
            }))
            .filter((u) => u.unit_id > 0),
        );
      })
      .catch(() => {
        if (active) setUnits([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(
    async (submitStatus: 'DR' | 'AC') => {
      if (!id) return;
      const v = form.getValues();
      if (!v.title.trim()) {
        setError('กรุณากรอกชื่อรายการ');
        return;
      }
      if (submitStatus === 'AC' && v.content_type !== 'ID') {
        if (imageUrls.length === 0 || !String(imageUrls[0] ?? '').trim()) {
          setError('กรุณาอัปโหลดภาพปกอย่างน้อย 1 รูปก่อนเผยแพร่');
          return;
        }
      }
      if (v.content_type === 'PM') {
        if (submitStatus === 'AC') {
          if (v.promo_price == null || Number(v.promo_price) <= 0) {
            setError('กรุณากรอกราคาโปรโมชันให้มากกว่า 0');
            return;
          }
          if (
            v.base_price != null &&
            Number(v.base_price) > 0 &&
            Number(v.promo_price) > Number(v.base_price)
          ) {
            setError('ราคาโปรโมชันต้องไม่มากกว่าราคาปกติ');
            return;
          }
        }
        if (!v.start_date || !v.end_date) {
          setError('โปรโมชันต้องมีวันเริ่มและวันสิ้นสุด');
          return;
        }
        if (v.end_date < v.start_date) {
          setError('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่ม');
          return;
        }
      }
      setSaving(true);
      setError('');
      setLinkedShowcaseError('');
      const coverUrl = imageUrls[0] ?? '';
      const base = {
        content_type: v.content_type,
        status: submitStatus,
        title: v.title.trim(),
        excerpt: v.content_type === 'ID' ? undefined : v.excerpt.trim() || undefined,
        content: v.content.trim() || undefined,
        image_url: coverUrl || undefined,
        category_id: v.category_id ?? undefined,
        sub_category_id: v.sub_category_id ?? undefined,
        unit_id: v.unit_id ?? undefined,
        lead_time_days: v.lead_time_days ?? undefined,
        linked_showcases: [...imageUrls, ...selectedShowcaseIds],
      };

      const payload: Record<string, unknown> =
        v.content_type === 'ID'
          ? base
          : v.content_type === 'PM'
            ? {
                ...base,
                moq: v.moq ?? undefined,
                base_price: v.base_price ?? undefined,
                promo_price: v.promo_price ?? undefined,
                start_date: v.start_date || undefined,
                end_date: v.end_date || undefined,
              }
            : {
                ...base,
                moq: v.moq ?? undefined,
                base_price: v.base_price ?? undefined,
              };

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
          qc.invalidateQueries({ queryKey: ['showcase', id] }),
          qc.invalidateQueries({ queryKey: ['showcases'] }),
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

  const onBack = useCallback(() => {
    if (form.formState.isDirty) {
      const ok = window.confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?');
      if (!ok) return;
    }
    navigate(backPath);
  }, [backPath, form.formState.isDirty, navigate]);

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
          className={factoryButtonClass({ variant: 'secondary', size: 'md' })}
        >
          ลองใหม่
        </Button>
      </div>
    );
  }
  if (isLoading) return <FormSkeleton sections={4} />;

  return (
    <form className='pb-28'>
      {/* Full-width sticky header — escapes FactoryPortalLayout padding */}
      <header className='sticky top-0 z-[99999] -mx-3 -mt-4 flex w-[calc(100%+1.5rem)] border-b border-slate-200 bg-white sm:-mx-4 sm:-mt-5 sm:w-[calc(100%+2rem)] md:-mx-6 md:w-[calc(100%+3rem)] lg:-mx-8 lg:-mt-6 lg:w-[calc(100%+4rem)] 2xl:-mx-10 2xl:w-[calc(100%+5rem)]'>
        <div className='flex h-16 w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 2xl:px-10'>
          <Button
            variant='unstyled'
            type='button'
            onClick={onBack}
            className={factoryButtonClass({ variant: 'toolbar', size: 'sm' })}
          >
            <ChevronLeft size={18} />
            กลับ
          </Button>

          <div className='flex items-center gap-2'>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void save('DR')}
              disabled={saving}
              className={factoryButtonClass({ variant: 'secondary', size: 'sm' })}
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
            </Button>
            <Button
              variant='unstyled'
              type='button'
              onClick={() => void save('AC')}
              disabled={saving || !canPublish}
              className={factoryButtonClass({ variant: 'primary', size: 'sm' })}
            >
              {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
            </Button>
          </div>
        </div>
      </header>

      <div className='max-w-[1500px] mx-auto px-0 py-5'>
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

        <div
          className={`grid auto-rows-min gap-5 ${
            contentType === 'ID'
              ? 'lg:grid-cols-3 2xl:grid-cols-4'
              : 'lg:grid-cols-2 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]'
          }`}
        >
          {/* Image — col 1 */}
          {/* Col 1: RelatedShowcasePicker (ID) or ImageManager (others) */}
          {contentType === 'ID' ? (
            <section
              className={factoryCardClass({
                variant: 'section',
                className: 'h-full space-y-3 lg:order-2 lg:col-span-1',
              })}
            >
              <div className='flex items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                <p className='text-sm font-bold text-gray-800'>อ้างอิงสินค้า / โปรโมชัน</p>
              </div>
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
          ) : (
            <div>
              <ShowcaseImageManager
                imageUrls={imageUrls}
                uploading={uploading}
                onPickImage={(file) => void onPickImage(file)}
                onRemoveImage={(url) => void removeImage(url)}
              />
            </div>
          )}

          {/* Col 2: Form fields */}
          <section
            className={factoryCardClass({
              variant: 'section',
              className: `space-y-5 ${
                contentType === 'ID' ? 'lg:order-1 lg:col-span-2 2xl:col-span-3' : ''
              }`,
            })}
          >
            <div className='flex items-center justify-between gap-3 border-b border-slate-100 pb-3'>
              <p className='text-sm font-bold text-gray-800'>รายละเอียดสินค้า</p>
              <ShowcaseTypeBadge type={contentType} />
            </div>
            <p className='text-xs text-gray-500'>
              สถานะ:{' '}
              <span className='font-semibold text-gray-700'>
                {
                  (
                    {
                      DR: 'ร่าง',
                      AC: 'Active',
                      HI: 'Hidden',
                      AR: 'เก็บเข้าคลัง',
                    } as const
                  )[form.watch('status') ?? 'DR']
                }
              </span>
            </p>

            <Label className='block'>
              <span className='text-xs text-gray-500 font-medium'>ชื่อ *</span>
              <Input
                className={factoryInputClass({
                  className:
                    'mt-1 font-normal text-gray-900 placeholder:text-xs placeholder:font-normal placeholder:text-gray-400 shadow-none focus:outline-none focus-visible:border-brand-purple/40 focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-brand-purple/10',
                })}
                placeholder='ชื่อสินค้า / ไอเดีย'
                {...form.register('title', { required: true })}
              />
            </Label>

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
            />
          </section>

          {/* ราคา / MOQ / Lead time — separate card, full width (non-ID only) */}
          {contentType !== 'ID' && (
            <section
              className={factoryCardClass({
                variant: 'section',
                className: 'space-y-5 lg:col-span-2 2xl:col-span-2',
              })}
            >
              <div className='flex items-center justify-between gap-3 border-b border-slate-100 pb-3'>
                <p className='text-sm font-bold text-gray-800'>ราคา & การผลิต</p>
              </div>
              <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>ราคาเริ่มต้น (฿)</span>
                  <Input
                    type='number'
                    step='0.01'
                    className={factoryInputClass({
                      className:
                        'mt-1 shadow-none focus-visible:border-brand-purple/40 focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-brand-purple/10',
                    })}
                    value={form.watch('base_price') ?? ''}
                    onChange={(e) =>
                      form.setValue(
                        'base_price',
                        e.target.value === '' ? null : Number(e.target.value),
                        {
                          shouldDirty: true,
                        },
                      )
                    }
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>MOQ (จำนวนขั้นต่ำ)</span>
                  <Input
                    type='number'
                    className={factoryInputClass({
                      className:
                        'mt-1 shadow-none focus-visible:border-brand-purple/40 focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-brand-purple/10',
                    })}
                    value={form.watch('moq') ?? ''}
                    onChange={(e) =>
                      form.setValue('moq', e.target.value === '' ? null : Number(e.target.value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </Label>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>หน่วยนับ</span>
                  <div className='mt-1'>
                    <UnitPicker
                      units={units}
                      value={form.watch('unit_id') ?? undefined}
                      onChange={(unitId) =>
                        form.setValue('unit_id', unitId ?? null, { shouldDirty: true })
                      }
                    />
                  </div>
                </Label>
                <Label className='block'>
                  <span className='text-xs text-gray-500'>Lead time (วัน)</span>
                  <Input
                    type='number'
                    className={factoryInputClass({
                      className:
                        'mt-1 shadow-none focus-visible:border-brand-purple/40 focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-brand-purple/10',
                    })}
                    value={form.watch('lead_time_days') ?? ''}
                    onChange={(e) =>
                      form.setValue(
                        'lead_time_days',
                        e.target.value === '' ? null : Number(e.target.value),
                        { shouldDirty: true },
                      )
                    }
                  />
                </Label>
              </div>

              {contentType === 'PM' && (
                <div className='grid gap-3 border-t border-dashed border-brand-purple/20 pt-3 sm:grid-cols-2 xl:grid-cols-3'>
                  <Label className='block'>
                    <span className='text-xs font-medium text-brand-purple'>
                      ราคาโปรโมชัน (฿) *
                    </span>
                    <Input
                      type='number'
                      placeholder='0.00'
                      className={factoryInputClass({
                        className:
                          'mt-1 border-brand-purple/20 shadow-none focus:outline-none focus:ring-1 focus:ring-brand-purple/10 focus-visible:shadow-none',
                      })}
                      value={form.watch('promo_price') ?? ''}
                      onChange={(e) =>
                        form.setValue(
                          'promo_price',
                          e.target.value === '' ? null : Number(e.target.value),
                          { shouldDirty: true },
                        )
                      }
                    />
                  </Label>
                  <Label className='block'>
                    <span className='text-xs font-medium text-brand-purple'>วันที่เริ่มโปร *</span>
                    <Input
                      type='date'
                      className={factoryInputClass({
                        className:
                          'mt-1 border-brand-purple/20 shadow-none focus:outline-none focus:ring-1 focus:ring-brand-purple/10 focus-visible:shadow-none',
                      })}
                      {...form.register('start_date')}
                    />
                  </Label>
                  <Label className='block'>
                    <span className='text-xs font-medium text-brand-purple'>
                      วันที่สิ้นสุดโปร *
                    </span>
                    <Input
                      type='date'
                      className={factoryInputClass({
                        className:
                          'mt-1 border-brand-purple/20 shadow-none focus:outline-none focus:ring-1 focus:ring-brand-purple/10 focus-visible:shadow-none',
                      })}
                      {...form.register('end_date')}
                    />
                  </Label>
                </div>
              )}
            </section>
          )}

          {/* Markdown — full width */}
          <section
            className={
              contentType === 'ID'
                ? 'lg:order-3 lg:col-span-3 2xl:col-span-4'
                : 'lg:order-3 lg:col-span-2'
            }
          >
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
        </div>
      </div>
    </form>
  );
}
