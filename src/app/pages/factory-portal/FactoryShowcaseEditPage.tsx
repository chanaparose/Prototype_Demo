import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { ChevronLeft, Plus, X, Camera } from 'lucide-react';

import { mediaApi, showcasesApi } from '../../services/api';
import { useEditForm } from '../../hooks/forms/useEditForm';
import { useBeforeUnload } from '../../hooks/forms/useBeforeUnload';
import { FormSkeleton } from '../../components/common/FormSkeleton';
import { LookupSelect } from '../../components/common/LookupSelect';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { type ShowcaseType } from '../../components/factory/showcase/ShowcaseTypeSelector';
import { useProductCategories } from '../../hooks/master/useProductCategories';
import { useSubCategoriesByCategories } from '../../hooks/master/useSubCategoriesByCategory';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { RelatedShowcasePicker } from '../../components/features/factory-portal/RelatedShowcasePicker';
import { mapLinkedShowcasesErrorToThai, partitionLinkedShowcases } from '../../utils/linkedShowcases';

/* ── Type badge metadata ── */
const TYPE_META = {
  PD: { icon: '🏷', label: 'สินค้า', sub: 'Product Design', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  PM: { icon: '🎁', label: 'โปรโมชัน', sub: 'Promotion', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ID: { icon: '💡', label: 'ไอเดีย', sub: 'Industrial Design', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
} as const;

const PRODUCT_MARKDOWN_TEMPLATE = `> รับผลิต OEM พร้อมช่วยปรับสูตร เริ่ม MOQ 500 ถุง เหมาะสำหรับเริ่มทำแบรนด์

รับผลิตอาหารเม็ดสูตร Grain-Free สำหรับสุนัขและแมว ใช้วัตถุดิบคุณภาพสูง ปรับสูตรตามกลุ่มเป้าหมาย พร้อมออกแบบแพ็กเกจให้ตรงตลาด

## จุดเด่นที่เหมาะกับแบรนด์

- **รองรับการเริ่มต้น**: เหมาะกับการทดลองตลาดและปรับสูตร/สเปกตามกลุ่มลูกค้า
- **Lead time ชัดเจน**: ระยะเวลาผลิตเฉลี่ย {lead_time} ช่วยวางแผนเปิดตัวได้ง่าย
- **ยกระดับ Perceived Value**: เพิ่มความน่าเชื่อถือและภาพลักษณ์แบรนด์ด้วยสเปกและมาตรฐานที่ครบ

## ข้อมูลที่ควรแจ้งโรงงานก่อนเริ่มผลิต

1. กลุ่มเป้าหมายและตำแหน่งราคาที่ต้องการ
2. สูตร/ขนาดเม็ด/คุณสมบัติหลักของสินค้า
3. รูปแบบบรรจุภัณฑ์ และจำนวนที่ต้องการต่อรอบผลิต
4. มาตรฐานหรือเอกสารที่ต้องใช้ เช่น อย., Halal, GMP
`;

const ID_TEMPLATE = `## ที่มาของไอเดีย

อธิบายแรงบันดาลใจและปัญหาที่ต้องการแก้ไข...

## แนวทางการออกแบบ

---

## ผลลัพธ์และสิ่งที่ทำได้

- จุดที่ 1
- จุดที่ 2`;

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
  const image_url = mergedImageUrls[0] ?? String(r.image_url ?? '').trim();
  return {
    content_type: (ct === 'PM' || ct === 'ID' ? ct : 'PD') as ShowcaseType,
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
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uploading, setUploading] = React.useState(false);
  const [imageUrls, setImageUrls] = React.useState<string[]>([]);
  const [selectedShowcaseIds, setSelectedShowcaseIds] = React.useState<number[]>([]);
  const [linkedShowcaseError, setLinkedShowcaseError] = React.useState('');
  const didHydrateFromServerRef = React.useRef(false);

  React.useEffect(() => {
    didHydrateFromServerRef.current = false;
  }, [id]);

  const removeImage = useCallback((urlToRemove: string) => {
    setImageUrls((prev) => prev.filter((u) => u !== urlToRemove));
  }, []);

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

  const categoriesQ = useProductCategories();

  const selectedCategoryId = form.watch('category_id');
  const contentType = form.watch('content_type');
  const backPath = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    if (typeof from === 'string' && from.startsWith('/factory/showcases')) return from;
    return `/factory/showcases?type=${contentType}`;
  }, [location.state, contentType]);

  const subIds = useMemo(
    () => (selectedCategoryId != null ? [selectedCategoryId] : []),
    [selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    selectedCategoryId != null ? subsResult.byCategory.get(selectedCategoryId) ?? [] : [];

  const save = useCallback(async (submitStatus: 'DR' | 'AC') => {
    if (!id) return;
    const v = form.getValues();
    if (!v.title.trim()) {
      setError('กรุณากรอกชื่อรายการ');
      return;
    }
    if (v.content_type === 'PM') {
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
      navigate('/factory/showcases', { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ';
      const linkedMsg = mapLinkedShowcasesErrorToThai(msg);
      if (linkedMsg) setLinkedShowcaseError(linkedMsg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [id, form, qc, imageUrls, selectedShowcaseIds, navigate, backPath]);

  const onBack = useCallback(() => {
    if (form.formState.isDirty) {
      const ok = window.confirm('มีข้อมูลที่ยังไม่บันทึก ต้องการออกจากหน้านี้หรือไม่?');
      if (!ok) return;
    }
    navigate('/factory/showcases');
  }, [form.formState.isDirty, navigate]);

  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
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
    }
  };

  /* content_type is read-only on edit — derived from loaded data */
  const typeMeta = TYPE_META[contentType] ?? TYPE_META.PD;

  if (!id || fid == null) return null;
  if (isError) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600 mb-3">โหลดไม่สำเร็จ</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-2 rounded-xl border text-sm"
        >
          ลองใหม่
        </button>
      </div>
    );
  }
  if (isLoading) return <FormSkeleton sections={4} />;

  return (
    <form className="max-w-3xl mx-auto w-full min-w-0 pb-28" style={{ backgroundColor: '#F8F6FA' }}>

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: '#4F46E5' }}
        >
          <ChevronLeft size={18} /> กลับ
        </button>

        {/* Fixed type badge — not editable */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeMeta.cls}`}>
          {typeMeta.icon} {typeMeta.label}
          <span className="opacity-60 hidden sm:inline">· {typeMeta.sub}</span>
        </span>

        <button
          type="button"
          onClick={() => void save('DR')}
          disabled={saving}
          className="text-sm font-semibold disabled:opacity-40 transition-colors whitespace-nowrap"
          style={{ color: '#4F46E5' }}
        >
          บันทึกร่าง
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        ) : null}

        {/* ── Cover image (hero) ── */}
        {contentType !== 'ID' ? (
          <section>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors cursor-pointer">
            {imageUrls[0] ? (
              <>
                <img src={imageUrls[0]} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(imageUrls[0])}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                  aria-label="ลบภาพปก"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer text-gray-400 hover:text-orange-500 transition-colors">
                <Camera size={36} strokeWidth={1.5} />
                <span className="text-sm font-medium">
                  {uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่ออัปโหลดภาพปก'}
                </span>
                <span className="text-xs opacity-70">PNG, JPG, WEBP · สูงสุด 5 รูป</span>
                <input
                  type="file" accept="image/*" className="hidden" disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ''; void onPickImage(f); }}
                />
              </label>
            )}
            </div>

            {/* Additional images */}
            {imageUrls.length > 0 ? (
              <div className="flex gap-2 mt-2 flex-wrap">
                {imageUrls.slice(1).map((url, i) => (
                  <div key={`${url}-${i}`} className="relative w-16 h-16 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center z-10"
                      aria-label="ลบภาพ"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {imageUrls.length < 5 ? (
                  <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange-300 hover:text-orange-500 shrink-0 transition-colors">
                    <Plus size={16} />
                    <span className="text-[9px] mt-0.5">เพิ่ม</span>
                    <input
                      type="file" accept="image/*" className="hidden" disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0] ?? null; e.target.value = ''; void onPickImage(f); }}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ── Title (large borderless) ── */}
        <input
          className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none pb-1.5 bg-transparent transition-colors"
          placeholder="ชื่อ *"
          {...form.register('title', { required: true })}
        />

        {/* ── Excerpt (PD/PM only) ── */}
        {contentType !== 'ID' ? (
          <input
            className="w-full text-sm text-gray-500 placeholder-gray-300 border-0 border-b border-transparent focus:border-orange-300 focus:outline-none pb-1 bg-transparent transition-colors"
            placeholder="คำโปรย (excerpt) — ประโยคสั้นๆ บอกจุดเด่น"
            {...form.register('excerpt')}
          />
        ) : null}

        {/* ── Section card: ข้อมูลหลัก ── */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">ข้อมูลหลัก</p>

          {/* Row 1: Category | Sub-category | Status */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <LookupSelect
                  label="หมวดหมู่"
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    form.setValue('sub_category_id', null, { shouldDirty: true });
                  }}
                  queryResult={categoriesQ}
                  getId={(o) => o.id}
                  getLabel={(o) => o.name}
                  placeholder="เลือกหมวดหมู่"
                />
              )}
            />
            <Controller
              control={form.control}
              name="sub_category_id"
              render={({ field }) => (
                <label className="block">
                  <span className="text-xs text-gray-500 mb-1.5 block">หมวดหมู่ย่อย</span>
                  <select
                    disabled={selectedCategoryId == null || subsResult.isLoading}
                    value={field.value != null ? String(field.value) : ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v ? Number(v) : null);
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none disabled:bg-gray-50"
                  >
                    <option value="">
                      {selectedCategoryId == null
                        ? '— เลือกหมวดหมู่ก่อน —'
                        : subsResult.isLoading
                          ? 'กำลังโหลด…'
                          : '— เลือกหมวดหมู่ย่อย —'}
                    </option>
                    {subOptions.map((o) => (
                      <option key={o.id} value={String(o.id)}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            />
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <label className="block">
                  <span className="text-xs text-gray-500 mb-1.5 block">สถานะ</span>
                  <select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  >
                    <option value="DR">ร่าง</option>
                    <option value="AC">Active</option>
                    <option value="HI">Hidden</option>
                    <option value="AR">เก็บเข้าคลัง</option>
                  </select>
                </label>
              )}
            />
          </div>

          {/* Row 2: MOQ | Lead time | Price (PD/PM only) */}
          {contentType !== 'ID' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">MOQ</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('moq', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">Lead time (วัน)</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('lead_time_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">ราคา (฿)</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('base_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                />
              </label>
            </div>
          )}

          {/* Row 3: Promo price | Start date | End date (PM only) */}
          {contentType === 'PM' && (
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">ราคาโปรโมชัน (฿)</span>
                <input
                  type="number"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('promo_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
                  placeholder="0.00"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">วันที่เริ่มโปร</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('start_date')}
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1.5 block">วันที่สิ้นสุดโปร</span>
                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-[#4F46E5] focus:ring-1 focus:ring-indigo- outline-none"
                  {...form.register('end_date')}
                />
              </label>
            </div>
          )}
        </section>

        {/* ── Section card: รายละเอียด ── */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">รายละเอียด</p>
          <Controller
            control={form.control}
            name="content"
            render={({ field }) => (
              <MarkdownEditor
                label="รายละเอียด (Markdown)"
                value={field.value ?? ''}
                onChange={field.onChange}
                minHeight={300}
                templateContent={contentType === 'ID' ? ID_TEMPLATE : PRODUCT_MARKDOWN_TEMPLATE}
                disabled={form.getValues('status') === 'AR'}
              />
            )}
          />
        </section>

        {contentType === 'ID' ? (
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
            <label className="block text-sm font-semibold text-[#2E2252]">
              อ้างอิงสินค้า / โปรโมชัน (ไม่บังคับ)
            </label>
            <p className="text-xs text-gray-500">
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

      {/* ── Sticky bottom bar ── */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
        <button
          type="button"
          onClick={() => void save('DR')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl border text-sm font-semibold disabled:opacity-50 transition-colors"
          style={{ borderColor: '#4F46E5', color: '#4F46E5' }}
        >
          บันทึกร่าง
        </button>
        <button
          type="button"
          onClick={() => void save('AC')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
        >
          เผยแพร่
        </button>
      </div>
    </form>
  );
}
