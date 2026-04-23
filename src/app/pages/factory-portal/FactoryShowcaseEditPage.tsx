import React, { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Controller } from 'react-hook-form';
import { ChevronLeft, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

import { showcasesApi } from '../../services/api';
import { useEditForm } from '../../hooks/forms/useEditForm';
import { useBeforeUnload } from '../../hooks/forms/useBeforeUnload';
import { FormSkeleton } from '../../components/common/FormSkeleton';
import { LookupSelect } from '../../components/common/LookupSelect';
import { useProductCategories } from '../../hooks/master/useProductCategories';
import { useSubCategoriesByCategories } from '../../hooks/master/useSubCategoriesByCategory';
import { useUnits } from '../../hooks/master/useUnits';

type ContentType = 'PD' | 'PM' | 'ID';
type EditorTab = 'write' | 'preview';

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

function normalizeMarkdownContent(raw: string): string {
  return raw
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

interface ShowcaseFormValues {
  content_type: ContentType;
  type: ContentType;
  title: string;
  excerpt: string;
  content: string;
  image_url: string;
  images: string[];
  category_id: number | null;
  sub_category_id: number | null;
  moq: number | null;
  lead_time_days: number | null;
  base_price: number | null;
  unit_id: number | null;
  promo_price: number | null;
  production_capacity: number | null;
  sample_available: boolean;
  start_date: string;
  end_date: string;
  status: 'DR' | 'AC' | 'HI' | 'AR';
}

const DEFAULTS: ShowcaseFormValues = {
  content_type: 'PD',
  type: 'PD',
  title: '',
  excerpt: '',
  content: '',
  image_url: '',
  images: [],
  category_id: null,
  sub_category_id: null,
  moq: null,
  lead_time_days: null,
  base_price: null,
  unit_id: null,
  promo_price: null,
  production_capacity: null,
  sample_available: false,
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

function parseImageUrls(raw: unknown): string[] {
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
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (!item || typeof item !== 'object') return '';
      const row = item as Record<string, unknown>;
      return String(row.url ?? row.image_url ?? row.public_url ?? '').trim();
    })
    .filter((u) => u !== '')
    .slice(0, 5);
}

function mapShowcaseToForm(raw: Raw): ShowcaseFormValues {
  const r = raw ?? {};
  const ct = String(r.type ?? r.content_type ?? 'PD').toUpperCase();
  const images = parseImageUrls(r.images ?? r.image_urls ?? r.imageUrls);
  const image_url = images[0] ?? String(r.image_url ?? '').trim();
  return {
    content_type: (ct === 'PM' || ct === 'ID' ? ct : 'PD') as ContentType,
    type: (ct === 'PM' || ct === 'ID' ? ct : 'PD') as ContentType,
    title: String(r.title ?? '').trim(),
    excerpt: String(r.excerpt ?? '').trim(),
    content: String(r.content ?? r.description ?? '').trim(),
    image_url,
    images,
    category_id: numOrNull(r.category_id),
    sub_category_id: numOrNull(r.sub_category_id),
    moq: numOrNull(r.moq ?? r.min_order),
    lead_time_days: numOrNull(r.lead_time_days),
    base_price: numOrNull(r.base_price ?? r.price),
    unit_id: numOrNull(r.unit_id),
    promo_price: numOrNull(r.promo_price ?? r.special_price),
    production_capacity: numOrNull(r.production_capacity),
    sample_available: Boolean(r.sample_available),
    start_date: String(r.start_date ?? '').slice(0, 10),
    end_date: String(r.end_date ?? '').slice(0, 10),
    status: (['DR', 'AC', 'HI', 'AR'].includes(String(r.status))
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
  const [contentTab, setContentTab] = React.useState<EditorTab>('write');
  const markdownContent = normalizeMarkdownContent(form.watch('content') || '');

  const save = useCallback(async () => {
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

    const payload: Record<string, unknown> = {
      type: v.content_type,
      content_type: v.content_type,
      title: v.title.trim(),
      excerpt: v.excerpt.trim() || undefined,
      content: v.content.trim() || undefined,
      images: [v.image_url.trim()].filter((u) => u !== ''),
      image_url: v.image_url.trim() || undefined,
      category_id: v.category_id ?? undefined,
      sub_category_id: v.sub_category_id ?? undefined,
      status: v.status,
    };
    if (v.content_type === 'PD' || v.content_type === 'PM') {
      payload.moq = v.moq ?? undefined;
      payload.lead_time_days = v.lead_time_days ?? undefined;
      payload.base_price = v.base_price ?? undefined;
      payload.production_capacity = v.production_capacity ?? undefined;
      payload.sample_available = v.sample_available;
      payload.unit_id = v.unit_id ?? undefined;
    }
    if (v.content_type === 'PM') {
      payload.promo_price = v.promo_price ?? undefined;
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
                  <option value="AC">Active</option>
                  <option value="HI">Hidden</option>
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
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">รายละเอียด (Markdown)</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded-md border ${contentTab === 'write' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 text-gray-600'}`}
                onClick={() => setContentTab('write')}
              >
                Write
              </button>
              <button
                type="button"
                className={`px-2 py-1 text-xs rounded-md border ${contentTab === 'preview' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'border-gray-200 text-gray-600'}`}
                onClick={() => setContentTab('preview')}
              >
                Preview
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                onClick={() => {
                  const current = form.getValues('content') ?? '';
                  if (!current.trim()) {
                    form.setValue('content', PRODUCT_MARKDOWN_TEMPLATE, { shouldDirty: true });
                  }
                }}
              >
                ใช้ตัวอย่าง
              </button>
            </div>
          </div>
          {contentTab === 'write' ? (
            <textarea
              rows={8}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono"
              {...form.register('content')}
            />
          ) : (
            <div className="mt-1 rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[180px]">
              {markdownContent ? (
                <div className="prose prose-sm max-w-none prose-p:text-[13px] prose-li:text-[13px] prose-headings:text-[15px] prose-strong:text-inherit prose-strong:font-semibold">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                    {markdownContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-xs text-gray-400">ยังไม่มีเนื้อหาให้แสดงตัวอย่าง</p>
              )}
            </div>
          )}
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
                {...form.register('base_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
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
                {...form.register('moq', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
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
              <span className="text-xs text-gray-500">ราคาโปรโมชัน</span>
              <input
                type="number"
                step="0.01"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                {...form.register('promo_price', { setValueAs: (v) => (v === '' ? null : Number(v)) })}
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
