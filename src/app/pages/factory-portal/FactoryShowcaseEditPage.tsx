import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { ChevronLeft, Save } from 'lucide-react';

import { showcasesApi } from '../../services/api';
import { useEditForm } from '../../hooks/forms/useEditForm';
import { useBeforeUnload } from '../../hooks/forms/useBeforeUnload';
import { FormSkeleton } from '../../components/common/FormSkeleton';
import { LookupSelect } from '../../components/common/LookupSelect';
import { useProductCategories } from '../../hooks/master/useProductCategories';
import { useSubCategoriesByCategories } from '../../hooks/master/useSubCategoriesByCategory';
import { useUnits } from '../../hooks/master/useUnits';

type ContentType = 'PD' | 'PM' | 'ID';

interface ShowcaseFormValues {
  content_type: ContentType;
  title: string;
  excerpt: string;
  description: string;
  image_url: string;
  category_id: number | null;
  sub_category_id: number | null;
  min_order: number | null;
  lead_time_days: number | null;
  price: number | null;
  unit_id: number | null;
  original_price: number | null;
  special_price: number | null;
  start_date: string;
  end_date: string;
  status: 'DR' | 'PB' | 'AR';
}

const DEFAULTS: ShowcaseFormValues = {
  content_type: 'PD',
  title: '',
  excerpt: '',
  description: '',
  image_url: '',
  category_id: null,
  sub_category_id: null,
  min_order: null,
  lead_time_days: null,
  price: null,
  unit_id: null,
  original_price: null,
  special_price: null,
  start_date: '',
  end_date: '',
  status: 'DR',
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

function mapShowcaseToForm(raw: Raw): ShowcaseFormValues {
  const r = raw ?? {};
  const ct = String(r.content_type ?? 'PD').toUpperCase();
  return {
    content_type: (ct === 'PM' || ct === 'ID' ? ct : 'PD') as ContentType,
    title: String(r.title ?? '').trim(),
    excerpt: String(r.excerpt ?? '').trim(),
    description: String(r.description ?? '').trim(),
    image_url: String(r.image_url ?? '').trim(),
    category_id: numOrNull(r.category_id),
    sub_category_id: numOrNull(r.sub_category_id),
    min_order: numOrNull(r.min_order),
    lead_time_days: numOrNull(r.lead_time_days),
    price: numOrNull(r.price),
    unit_id: numOrNull(r.unit_id),
    original_price: numOrNull(r.original_price),
    special_price: numOrNull(r.special_price),
    start_date: String(r.start_date ?? '').slice(0, 10),
    end_date: String(r.end_date ?? '').slice(0, 10),
    status: (['DR', 'PB', 'AR'].includes(String(r.status))
      ? String(r.status)
      : 'DR') as ShowcaseFormValues['status'],
  };
}

export function FactoryShowcaseEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { form, isLoading, isError, refetch } = useEditForm<ShowcaseFormValues, Raw>({
    queryKey: ['showcase', id] as const,
    queryFn: async () => {
      const raw = await showcasesApi.get(id!);
      const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
      return unwrapShowcasePayload(row);
    },
    mapper: mapShowcaseToForm,
    defaults: DEFAULTS,
    enabled: Boolean(id),
  });

  useBeforeUnload(form.formState.isDirty);

  const categoriesQ = useProductCategories();
  const unitsQ = useUnits();

  const selectedCategoryId = form.watch('category_id');
  const contentType = form.watch('content_type');

  const subIds = useMemo(
    () => (selectedCategoryId != null ? [selectedCategoryId] : []),
    [selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    selectedCategoryId != null ? subsResult.byCategory.get(selectedCategoryId) ?? [] : [];

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const save = useCallback(async () => {
    if (!id) return;
    const v = form.getValues();
    if (!v.title.trim()) {
      setError('กรุณากรอกชื่อโปรโมชัน/สินค้า/ไอเดีย');
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

    const payload: Record<string, unknown> = {
      title: v.title.trim(),
      excerpt: v.excerpt.trim() || undefined,
      description: v.description.trim() || undefined,
      image_url: v.image_url.trim() || undefined,
      category_id: v.category_id ?? undefined,
      sub_category_id: v.sub_category_id ?? undefined,
      status: v.status,
    };
    if (v.content_type === 'PD' || v.content_type === 'PM') {
      payload.min_order = v.min_order ?? undefined;
      payload.lead_time_days = v.lead_time_days ?? undefined;
      payload.price = v.price ?? undefined;
      payload.unit_id = v.unit_id ?? undefined;
    }
    if (v.content_type === 'PM') {
      payload.original_price = v.original_price ?? undefined;
      payload.special_price = v.special_price ?? undefined;
      payload.start_date = v.start_date;
      payload.end_date = v.end_date;
    }

    try {
      await showcasesApi.update(id, payload);
      form.reset(v);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['showcase', id] }),
        qc.invalidateQueries({ queryKey: ['showcases'] }),
      ]);
      navigate('/factory/showcases');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [id, form, qc, navigate]);

  if (!id) return null;
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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="max-w-3xl mx-auto w-full min-w-0 pb-28 space-y-5"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">แก้ไข Showcase #{id}</h1>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      ) : null}

      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="content_type"
            render={({ field }) => (
              <label className="block">
                <span className="text-xs text-gray-500">ประเภท *</span>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="PD">Product — สินค้า</option>
                  <option value="PM">Promotion — โปรโมชัน</option>
                  <option value="ID">Idea — ไอเดีย</option>
                </select>
              </label>
            )}
          />
          <Controller
            control={form.control}
            name="status"
            render={({ field }) => (
              <label className="block">
                <span className="text-xs text-gray-500">สถานะ</span>
                <select
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="DR">ร่าง</option>
                  <option value="PB">เผยแพร่</option>
                  <option value="AR">เก็บเข้าคลัง</option>
                </select>
              </label>
            )}
          />
        </div>

        <label className="block">
          <span className="text-xs text-gray-500">ชื่อเรื่อง *</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            {...form.register('title', { required: true })}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">คำโปรย (excerpt)</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            {...form.register('excerpt')}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">รายละเอียด</span>
          <textarea
            rows={5}
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            {...form.register('description')}
          />
        </label>

        <label className="block">
          <span className="text-xs text-gray-500">URL รูปปก</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="https://…"
            {...form.register('image_url')}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
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
                <span className="text-xs text-gray-500">หมวดหมู่ย่อย</span>
                <select
                  disabled={selectedCategoryId == null || subsResult.isLoading}
                  value={field.value != null ? String(field.value) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v ? Number(v) : null);
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
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
        </div>
      </section>

      {(contentType === 'PD' || contentType === 'PM') && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-900">ข้อมูลสินค้า</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-500">ราคา</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <Controller
              control={form.control}
              name="unit_id"
              render={({ field }) => (
                <LookupSelect
                  label="หน่วย"
                  value={field.value}
                  onChange={field.onChange}
                  queryResult={unitsQ}
                  getId={(o) => o.id}
                  getLabel={(o) => o.label}
                  placeholder="เลือกหน่วย"
                />
              )}
            />
            <label className="block">
              <span className="text-xs text-gray-500">MOQ (ขั้นต่ำ)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('min_order', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">Lead time (วัน)</span>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('lead_time_days', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
          </div>
        </section>
      )}

      {contentType === 'PM' && (
        <section className="bg-white rounded-2xl border border-amber-100 bg-amber-50/30 p-5 space-y-4">
          <h2 className="text-sm font-bold text-amber-900">พารามิเตอร์โปรโมชัน (Flash Sale)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-gray-500">ราคาเดิม</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('original_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">ราคาโปรโมชัน</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('special_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">วันเริ่ม *</span>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('start_date')}
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-500">วันสิ้นสุด *</span>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('end_date')}
              />
            </label>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || !form.formState.isDirty}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          <Save size={14} /> {saving ? 'กำลังบันทึก…' : 'บันทึก'}
        </button>
      </div>
    </form>
  );
}
