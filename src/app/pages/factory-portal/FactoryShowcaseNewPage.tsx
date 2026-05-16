import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ChevronLeft, Plus, X, Camera } from 'lucide-react';
import { showcasesApi, mediaApi } from '../../services/api';
import { LookupSelect } from '../../components/common/LookupSelect';
import { MarkdownEditor } from '../../components/common/MarkdownEditor';
import { useLbiCategoriesByScope } from '../../hooks/master/useLbiCategoriesByScope';
import { useSubCategoriesByCategories } from '../../hooks/master/useSubCategoriesByCategory';

type ShowcaseType = 'PD' | 'PM' | 'ID' | 'MT';
import { useAuth } from '../../stores';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { RelatedShowcasePicker } from '../../components/features/factory-portal/RelatedShowcasePicker';
import { mapLinkedShowcasesErrorToThai } from '../../utils/linkedShowcases';
import { ImageCropModal } from '../../components/common/ImageCropModal';

/* ── Type metadata ── */
const TYPE_META = {
  PD: { icon: '🏷', label: 'สินค้า', sub: 'Product Design', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  PM: { icon: '🎁', label: 'โปรโมชัน', sub: 'Promotion', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ID: { icon: '💡', label: 'ไอเดีย', sub: 'Industrial Design', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  MT: { icon: '🧱', label: 'วัตถุดิบ', sub: 'Materials', cls: 'bg-green-50 text-green-700 border-green-200' },
} as const;

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
    return t === 'PM' || t === 'ID' || t === 'MT' ? t : 'PD';
  })();

  const [form, setForm] = useState<FormValues>(EMPTY);
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
    contentType === 'MT' ? 'MT'
    : contentType === 'ID' ? idScope
    : contentType === 'PM' ? pmScope
    : 'PD';
  const categoriesQ = useLbiCategoriesByScope(categoryScope);
  const selectedCategoryId = Number(form.category_id);
  const subIds = useMemo(
    () => (contentType !== 'MT' && Number.isFinite(selectedCategoryId) && selectedCategoryId > 0 ? [selectedCategoryId] : []),
    [contentType, selectedCategoryId],
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
    }
    if (contentType === 'PM' && status === 'AC') {
      if (!form.promo_price || Number(form.promo_price) <= 0) {
        setError('กรุณากรอกราคาโปรโมชัน (฿) ให้มากกว่า 0');
        return;
      }
      if (form.base_price && Number(form.base_price) > 0 && Number(form.promo_price) > Number(form.base_price)) {
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
  const canPublish = form.title.trim().length > 0 && (contentType === 'ID' || imageUrls.length > 0);

  return (
    <div className="max-w-6xl mx-auto pb-28">

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

      <div className="px-4 py-5">
        <ImageCropModal
          open={cropFile != null}
          file={cropFile}
          title="จัดตำแหน่งภาพ Showcase"
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

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        ) : null}

        <div className="space-y-5 min-w-0">
            {/* Cover (PD/PM only) sits LEFT; title + main info sit RIGHT on xl. */}
            <div className="flex flex-col xl:flex-row xl:gap-5 xl:items-start gap-5">
            {/* ── Cover image (hero) ── */}
            {contentType !== 'ID' ? (
              <section className="w-full max-w-[360px] xl:shrink-0">
                <div
                  className="relative aspect-[4/3] rounded-xl overflow-hidden border"
                  style={{ borderColor: '#E7E2F0', background: '#F5F5F5' }}
                >
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
                      <div key={`${url}-${i}`} className="relative w-14 h-14 rounded-lg border border-gray-200 overflow-hidden shrink-0">
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
                      <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-orange-300 hover:text-orange-500 shrink-0 transition-colors">
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

            {/* Right column: title + main info (sits beside cover on xl) */}
            <div className="flex-1 min-w-0 space-y-5">
            {/* ── Title & excerpt ── */}
            <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-4 space-y-4">
              <input
                className="w-full text-2xl font-bold text-gray-900 placeholder-gray-300 border-0 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/35 rounded-lg transition-shadow"
                placeholder="ชื่อ *"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
            </section>

            {/* ── Info bar ── */}
            <section className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">ข้อมูลหลัก</p>

          {/* ID-type scope picker */}
          {contentType === 'ID' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ประเภทเนื้อหา
              </label>
              <div className="flex gap-2">
                {(['PD', 'MT'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setIdScope(s); setForm((f) => ({ ...f, category_id: '', sub_category_id: '' })); }}
                    className="flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: idScope === s ? '#4F46E5' : '#F8FAFC',
                      color: idScope === s ? '#fff' : '#334155',
                      borderColor: idScope === s ? '#4F46E5' : '#E2E8F0',
                    }}
                  >
                    {s === 'PD' ? '🏷 สินค้า' : '🧱 วัตถุดิบ'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PM-type scope picker */}
          {contentType === 'PM' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ประเภทสินค้าที่โปรโมท
              </label>
              <div className="flex gap-2">
                {(['PD', 'MT'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setPmScope(s); setForm((f) => ({ ...f, category_id: '', sub_category_id: '' })); }}
                    className="flex-1 py-2 px-3 rounded-xl border text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: pmScope === s ? '#4F46E5' : '#F8FAFC',
                      color: pmScope === s ? '#fff' : '#334155',
                      borderColor: pmScope === s ? '#4F46E5' : '#E2E8F0',
                    }}
                  >
                    {s === 'PD' ? '🏷 สินค้า' : '🧱 วัตถุดิบ'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const hideSubCat = contentType === 'MT' || (contentType === 'ID' && idScope === 'MT') || (contentType === 'PM' && pmScope === 'MT');
            return (
              <div className={`grid grid-cols-1 gap-3 ${hideSubCat ? '' : 'sm:grid-cols-2'}`}>
                <LookupSelect
                  label="หมวดหมู่"
                  value={form.category_id ? Number(form.category_id) : null}
                  onChange={(v) => { setField('category_id', v != null ? String(v) : ''); setField('sub_category_id', ''); }}
                  queryResult={categoriesQ}
                  getId={(o) => o.id}
                  getLabel={(o) => o.name}
                  placeholder="เลือกหมวดหมู่"
                />
                {!hideSubCat && (
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
                )}
              </div>
            );
          })()}

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
            </div>
            </div>

            {/* ── Markdown content (full width below cover/info) ── */}
            <section>
              <MarkdownEditor
                label="รายละเอียด (Markdown)"
                value={form.content}
                onChange={(v) => setField('content', v)}
                minHeight={300}
              />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-gray-900">การเผยแพร่</p>
                <p className="mt-1 text-xs text-gray-500">
                  {contentType === 'ID' ? 'กรอกชื่อและเนื้อหาให้ครบก่อนเผยแพร่' : 'กรอกชื่อและอัปโหลดภาพปกก่อนเผยแพร่'}
                </p>
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => void onSubmit('DR')}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 disabled:opacity-50 hover:bg-gray-50 transition-colors"
                  >
                    {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onSubmit('AC')}
                    disabled={saving || !canPublish}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
                  >
                    {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">สถานะฟอร์ม</p>
                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <span>ชื่อรายการ</span>
                    <span className={form.title.trim() ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                      {form.title.trim() ? 'พร้อม' : 'ยังไม่ครบ'}
                    </span>
                  </div>
                  {contentType !== 'ID' ? (
                    <div className="flex items-center justify-between">
                      <span>ภาพปก</span>
                      <span className={imageUrls.length > 0 ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-semibold'}>
                        {imageUrls.length > 0 ? `${imageUrls.length}/5` : 'ยังไม่เพิ่ม'}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

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
      </div>

      {/* ── Sticky bottom bar ── */}
      <div className="fixed xl:hidden bottom-0 left-0 right-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 px-4 py-3 flex gap-3">
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
          disabled={saving || !canPublish}
          className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50 shadow-sm active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #4338CA 100%)' }}
        >
          {saving ? 'กำลังเผยแพร่...' : 'เผยแพร่'}
        </button>
      </div>
    </div>
  );
}
