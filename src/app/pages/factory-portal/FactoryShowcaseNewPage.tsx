import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, Plus, X, Camera } from 'lucide-react';
import { showcasesApi, mediaApi } from '../../services/api';
import { LookupSelect } from '../../components/common/LookupSelect';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { type ShowcaseType } from '../../components/factory/showcase/ShowcaseTypeSelector';
import { useProductCategories } from '../../hooks/master/useProductCategories';
import { useSubCategoriesByCategories } from '../../hooks/master/useSubCategoriesByCategory';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { RelatedShowcasePicker } from '../../components/features/factory-portal/RelatedShowcasePicker';
import { mapLinkedShowcasesErrorToThai } from '../../utils/linkedShowcases';
import { ImageCropModal } from '../../components/common/ImageCropModal';

/* ── Type metadata ── */
const TYPE_META = {
  PD: { icon: '🏷', label: 'สินค้า', sub: 'Product Design', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  PM: { icon: '🎁', label: 'โปรโมชัน', sub: 'Promotion', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ID: { icon: '💡', label: 'ไอเดีย', sub: 'Industrial Design', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
} as const;

const PRODUCT_TEMPLATE = `> รับผลิต OEM พร้อมช่วยปรับสูตร เริ่ม MOQ 500 ถุง เหมาะสำหรับเริ่มทำแบรนด์

## จุดเด่น

- **รองรับการเริ่มต้น**: เหมาะกับการทดลองตลาด
- **Lead time ชัดเจน**: วางแผนเปิดตัวได้ง่าย

## ข้อมูลที่ควรแจ้งก่อนเริ่มผลิต

1. กลุ่มเป้าหมายและตำแหน่งราคา
2. สูตร/คุณสมบัติหลัก
3. รูปแบบบรรจุภัณฑ์และจำนวน
4. มาตรฐาน เช่น อย., Halal, GMP`;

const ID_TEMPLATE = `## ที่มาของไอเดีย

อธิบายแรงบันดาลใจและปัญหาที่ต้องการแก้ไข...

## แนวทางการออกแบบ

---

## ผลลัพธ์และสิ่งที่ทำได้

- จุดที่ 1
- จุดที่ 2`;

type FormValues = {
  title: string;
  excerpt: string;
  content: string;
  category_id: string;
  sub_category_id: string;
  moq: string;
  lead_time_days: string;
  base_price: string;
  promo_price: string;
  start_date: string;
  end_date: string;
};

const EMPTY: FormValues = {
  title: '', excerpt: '', content: '',
  category_id: '', sub_category_id: '',
  moq: '', lead_time_days: '', base_price: '',
  promo_price: '', start_date: '', end_date: '',
};

export function FactoryShowcaseNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const myFactoryId = getFactoryEntityId(user);

  /* content_type is FIXED from URL — cannot be changed on this page */
  const contentType: ShowcaseType = (() => {
    const t = searchParams.get('type');
    return t === 'PM' || t === 'ID' ? t : 'PD';
  })();

  const [form, setForm] = useState<FormValues>(EMPTY);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedShowcaseIds, setSelectedShowcaseIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [linkedShowcaseError, setLinkedShowcaseError] = useState('');

  const categoriesQ = useProductCategories();
  const selectedCategoryId = Number(form.category_id);
  const subIds = useMemo(
    () => (Number.isFinite(selectedCategoryId) && selectedCategoryId > 0 ? [selectedCategoryId] : []),
    [selectedCategoryId],
  );
  const subsResult = useSubCategoriesByCategories(subIds);
  const subOptions =
    Number.isFinite(selectedCategoryId) && selectedCategoryId > 0
      ? subsResult.byCategory.get(selectedCategoryId) ?? []
      : [];

  const setField = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* ── Image upload ── */
  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
    setCropFile(file);
  };

  const removeImage = (idx: number) => setImageUrls((prev) => prev.filter((_, i) => i !== idx));

  /* ── Payload builder ── */
  const buildPayload = (status: 'DR' | 'AC'): Record<string, unknown> => {
    const base = {
      content_type: contentType,
      status,
      title: form.title.trim(),
      excerpt: contentType !== 'ID' ? form.excerpt.trim() || undefined : undefined,
      content: form.content.trim() || undefined,
      image_url: imageUrls[0] ?? undefined,
      category_id: form.category_id ? Number(form.category_id) : undefined,
      sub_category_id: form.sub_category_id ? Number(form.sub_category_id) : undefined,
      lead_time_days: form.lead_time_days ? Number(form.lead_time_days) : undefined,
      linked_showcases: [...imageUrls, ...selectedShowcaseIds],
    };
    if (contentType === 'ID') return base;
    const withPrice = {
      ...base,
      moq: form.moq ? Number(form.moq) : undefined,
      base_price: form.base_price ? Number(form.base_price) : undefined,
    };
    if (contentType === 'PM') {
      return {
        ...withPrice,
        promo_price: form.promo_price ? Number(form.promo_price) : undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      };
    }
    return withPrice;
  };

  /* ── Submit ── */
  const onSubmit = async (status: 'DR' | 'AC') => {
    if (!form.title.trim()) { setError('กรุณากรอกชื่อ'); return; }
    if (contentType !== 'ID' && status === 'AC') {
      if (imageUrls.length === 0 || !String(imageUrls[0] ?? '').trim()) {
        setError('กรุณาอัปโหลดภาพปกอย่างน้อย 1 รูปก่อนเผยแพร่');
        return;
      }
      if (!form.base_price || Number(form.base_price) <= 0) {
        setError('กรุณากรอกราคา (฿) ให้มากกว่า 0');
        return;
      }
    }
    if (contentType === 'PM' && status === 'AC') {
      if (!form.promo_price || Number(form.promo_price) <= 0) {
        setError('กรุณากรอกราคาโปรโมชัน (฿) ให้มากกว่า 0');
        return;
      }
      if (Number(form.promo_price) > Number(form.base_price || 0)) {
        setError('ราคาโปรโมชันต้องไม่มากกว่าราคาปกติ');
        return;
      }
      if (!form.start_date || !form.end_date) { setError('โปรโมชันต้องมีวันเริ่มและวันสิ้นสุด'); return; }
      if (form.end_date < form.start_date) { setError('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่ม'); return; }
    }
    setSaving(true);
    setError('');
    setLinkedShowcaseError('');
    try {
      await showcasesApi.create(buildPayload(status) as Parameters<typeof showcasesApi.create>[0]);
      /* always navigate back to list after create */
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

  const typeMeta = TYPE_META[contentType];

  return (
    <div className="max-w-3xl mx-auto pb-28">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 h-14 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/factory/showcases')}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={18} />
          กลับ
        </button>

        {/* Fixed type badge */}
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeMeta.cls}`}>
          {typeMeta.icon} {typeMeta.label}
          <span className="opacity-60 hidden sm:inline">· {typeMeta.sub}</span>
        </span>

        <button
          type="button"
          onClick={() => void onSubmit('DR')}
          disabled={saving}
          className="text-sm text-gray-600 font-medium hover:text-gray-900 disabled:opacity-40 transition-colors whitespace-nowrap"
        >
          บันทึกร่าง
        </button>
      </div>

      <div className="px-4 py-5 space-y-5">
        <ImageCropModal
          open={cropFile != null}
          file={cropFile}
          title="จัดตำแหน่งภาพ Showcase"
          // PD/PM แสดงเป็น aspect-square (1:1) บนหน้า customer detail
          // → crop ที่ 1:1; ID เป็นบทความ → 16:9 banner
          aspect={contentType === 'ID' ? 16 / 9 : 1}
          outputWidth={contentType === 'ID' ? 1800 : 1200}
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
                  onClick={() => removeImage(0)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
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
                      onClick={() => removeImage(i + 1)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"
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

        {/* ── Title & excerpt ── */}
        <section className="space-y-3">
          <input
            className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 border-b-2 border-transparent focus:border-orange-400 focus:outline-none pb-1.5 bg-transparent transition-colors"
            placeholder="ชื่อ *"
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
          />
        </section>

        {/* ── Info bar ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">ข้อมูลหลัก</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LookupSelect
              label="หมวดหมู่"
              value={form.category_id ? Number(form.category_id) : null}
              onChange={(v) => { setField('category_id', v != null ? String(v) : ''); setField('sub_category_id', ''); }}
              queryResult={categoriesQ}
              getId={(o) => o.id}
              getLabel={(o) => o.name}
              placeholder="เลือกหมวดหมู่"
            />
            <label className="block">
              <span className="text-xs text-gray-500">หมวดหมู่ย่อย</span>
              <select
                value={form.sub_category_id}
                onChange={(e) => setField('sub_category_id', e.target.value)}
                disabled={!form.category_id || subsResult.isLoading}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">
                  {!form.category_id ? '— เลือกหมวดหมู่ก่อน —' : subsResult.isLoading ? 'กำลังโหลด…' : '— เลือกหมวดย่อย —'}
                </option>
                {subOptions.map((o) => (
                  <option key={o.id} value={String(o.id)}>{o.name}</option>
                ))}
              </select>
            </label>
          </div>

          {/* PD / PM fields */}
          {contentType !== 'ID' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="block">
                <span className="text-xs text-gray-500">ราคาเริ่มต้น (฿)</span>
                <input type="number" step="0.01" placeholder="0.00"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={form.base_price} onChange={(e) => setField('base_price', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">MOQ (ชิ้น)</span>
                <input type="number" placeholder="500"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={form.moq} onChange={(e) => setField('moq', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Lead time (วัน)</span>
                <input type="number" placeholder="30"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={form.lead_time_days} onChange={(e) => setField('lead_time_days', e.target.value)} />
              </label>
            </div>
          ) : null}

          {/* PM-only fields */}
          {contentType === 'PM' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-dashed border-purple-100">
              <label className="block">
                <span className="text-xs font-medium text-indigo-600">ราคาโปรโมชัน (฿) *</span>
                <input type="number" step="0.01" placeholder="0.00"
                  className="mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none"
                  value={form.promo_price} onChange={(e) => setField('promo_price', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-indigo-600">วันที่เริ่มโปร *</span>
                <input type="date"
                  className="mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none"
                  value={form.start_date} onChange={(e) => setField('start_date', e.target.value)} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-indigo-600">วันที่สิ้นสุดโปร *</span>
                <input type="date"
                  className="mt-1 w-full rounded-xl border border-indigo-200 px-3 py-2 text-sm focus:ring-1 focus:ring-indigo- focus:outline-none"
                  value={form.end_date} onChange={(e) => setField('end_date', e.target.value)} />
              </label>
            </div>
          ) : null}
        </section>

        {/* ── Markdown content ── */}
        <section>
          <MarkdownEditor
            label="รายละเอียด (Markdown)"
            value={form.content}
            onChange={(v) => setField('content', v)}
            minHeight={300}
            templateContent={contentType === 'ID' ? ID_TEMPLATE : PRODUCT_TEMPLATE}
          />
        </section>

        {contentType === 'ID' && myFactoryId != null ? (
          <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-3">
            <label className="block text-sm font-semibold text-[#2E2252]">
              อ้างอิงสินค้า / โปรโมชัน (ไม่บังคับ)
            </label>
            <p className="text-xs text-gray-500">
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

      {/* ── Sticky bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-3">
        <button
          type="button"
          onClick={() => void onSubmit('DR')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
        </button>
        <button
          type="button"
          onClick={() => void onSubmit('AC')}
          disabled={saving}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
        >
          {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
        </button>
      </div>
    </div>
  );
}
