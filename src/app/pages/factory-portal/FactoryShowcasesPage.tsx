import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Plus, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { showcasesApi, mediaApi, masterApi } from '../../services/api';

export const SHOWCASE_TYPES = [
  { type: 'PD' as const, label: 'สินค้า', hint: 'Product' },
  { type: 'PM' as const, label: 'โปรโมชัน', hint: 'Promotion' },
  { type: 'ID' as const, label: 'ไอเดีย / บทความ', hint: 'Idea' },
];

type ShowcaseType = (typeof SHOWCASE_TYPES)[number]['type'];

function isShowcaseType(s: string | null): s is ShowcaseType {
  return s === 'PD' || s === 'PM' || s === 'ID';
}

type Row = Record<string, unknown>;

function rowId(r: Row): string {
  return String(r.showcase_id ?? r.id ?? '');
}

function typeLabel(t: ShowcaseType): string {
  const f = SHOWCASE_TYPES.find((x) => x.type === t);
  return f?.label ?? t;
}

function typeBadgeClass(t: ShowcaseType): string {
  if (t === 'PD') return 'bg-violet-100 text-violet-800 border-violet-200';
  if (t === 'PM') return 'bg-amber-100 text-amber-900 border-amber-200';
  return 'bg-sky-100 text-sky-900 border-sky-200';
}

function promotionExpiryLine(r: Row): string | null {
  const raw = r.expire_date ?? r.end_date ?? r.valid_until ?? r.promotion_end;
  if (raw == null || String(raw).trim() === '') return null;
  const s = String(raw).trim();
  return `หมดอายุ ${s.length >= 10 ? s.slice(0, 10) : s}`;
}

function contextDetailLine(activeType: ShowcaseType, r: Row): string {
  if (activeType === 'PD') {
    return `MOQ ${String(r.min_order ?? '—')} · Lead ${String(r.lead_time_days ?? '—')} วัน`;
  }
  if (activeType === 'PM') {
    const exp = promotionExpiryLine(r);
    if (exp) return exp;
    const ex = String(r.excerpt ?? '').trim();
    if (!ex) return '—';
    return ex.length > 52 ? `${ex.slice(0, 52)}…` : ex;
  }
  const ex = String(r.excerpt ?? '').trim();
  if (!ex) return '—';
  return ex.length > 60 ? `${ex.slice(0, 60)}…` : ex;
}

function rowContentType(r: Row, fallback: ShowcaseType): ShowcaseType {
  const c = String(r.content_type ?? r.contentType ?? '').toUpperCase();
  if (c === 'PD' || c === 'PM' || c === 'ID') return c;
  return fallback;
}

function Thumbnail({ src }: { src: string | undefined }) {
  return (
    <div
      className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center"
      aria-hidden
    >
      {src ? (
        <img src={src} alt="" className="w-full h-full object-cover" />
      ) : (
        <ImageIcon className="text-gray-300" size={20} strokeWidth={1.5} />
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: ShowcaseType }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border ${typeBadgeClass(type)}`}
    >
      {typeLabel(type)}
    </span>
  );
}

export function FactoryShowcasesPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeType: ShowcaseType = useMemo(() => {
    const t = searchParams.get('type');
    return isShowcaseType(t) ? t : 'PD';
  }, [searchParams]);

  useEffect(() => {
    const t = searchParams.get('type');
    if (!isShowcaseType(t)) {
      setSearchParams({ type: 'PD' }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const setType = (type: ShowcaseType) => {
    setSearchParams({ type }, { replace: true });
  };

  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [leadDays, setLeadDays] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    if (fid == null) {
      setError('ไม่พบรหัสโรงงานในบัญชี');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [rawList, cats] = await Promise.all([
        showcasesApi.list(activeType),
        masterApi.productCategories().catch(() => []),
      ]);
      const arr = (Array.isArray(rawList) ? rawList : []) as Row[];
      const mine = arr.filter((s) => Number(s.factory_id ?? s.factoryId) === fid);
      setRows(mine);
      setCategories((Array.isArray(cats) ? cats : []) as Row[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดโชว์เคสไม่สำเร็จ');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fid, activeType]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setExcerpt('');
    setImageUrl('');
    setCategoryId('');
    setMinOrder('');
    setLeadDays('');
    setModal('create');
    setOkMsg('');
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setTitle(String(r.title ?? ''));
    setExcerpt(String(r.excerpt ?? ''));
    setImageUrl(String(r.image_url ?? ''));
    setCategoryId(
      r.category_id != null && r.category_id !== ''
        ? String(r.category_id)
        : '',
    );
    setMinOrder(r.min_order != null ? String(r.min_order) : '');
    setLeadDays(r.lead_time_days != null ? String(r.lead_time_days) : '');
    setModal('edit');
    setOkMsg('');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const up = await mediaApi.upload(file);
      setImageUrl(up.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      image_url: imageUrl.trim() || undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
    };
    if (activeType === 'PD') {
      payload.min_order = minOrder ? Number(minOrder) : undefined;
      payload.lead_time_days = leadDays ? Number(leadDays) : undefined;
    }
    return payload;
  };

  const submit = async () => {
    if (!title.trim()) {
      setError('กรุณากรอกหัวข้อ');
      return;
    }
    setSaving(true);
    setError('');
    setOkMsg('');
    try {
      if (modal === 'create') {
        const body = buildPayload();
        await showcasesApi.create({
          content_type: activeType,
          title: String(body.title ?? title.trim()),
          excerpt: body.excerpt as string | undefined,
          image_url: body.image_url as string | undefined,
          category_id: body.category_id as number | undefined,
          min_order: body.min_order as number | undefined,
          lead_time_days: body.lead_time_days as number | undefined,
        });
        setOkMsg('สร้างรายการแล้ว');
      } else if (modal === 'edit' && editing) {
        await showcasesApi.update(rowId(editing), {
          ...buildPayload(),
          content_type: activeType,
        });
        setOkMsg('บันทึกการแก้ไขแล้ว');
      }
      closeModal();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: Row) => {
    const id = rowId(r);
    if (!id || !window.confirm('ลบรายการนี้?')) return;
    setError('');
    try {
      await showcasesApi.delete(id);
      setOkMsg('ลบแล้ว');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ — API อาจยังไม่รองรับ');
    }
  };

  if (fid == null) {
    return <p className="text-sm text-red-600">บัญชีนี้ไม่ใช่โรงงาน</p>;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-10 sm:pb-12 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 uppercase">GET /showcases?type=…</p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">จัดการโชว์เคส</h2>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          <Plus size={18} />
          เพิ่มรายการ ({activeType})
        </button>
      </div>

      {/* Section tabs — เลื่อนแนวนอนบนมือถือ */}
      <div className="-mx-1 px-1 overflow-x-auto overflow-y-hidden pb-0.5">
        <div className="flex flex-nowrap sm:flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-max min-w-full sm:min-w-0 sm:w-fit max-w-none">
        {SHOWCASE_TYPES.map(({ type, label, hint }) => {
          const on = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                on ? 'text-white shadow-md' : 'text-gray-600 hover:bg-white/80'
              }`}
              style={
                on
                  ? { background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }
                  : {}
              }
              title={`?type=${type} (${hint})`}
            >
              {label}
              <span className="ml-1 text-[10px] font-normal opacity-80">{type}</span>
            </button>
          );
        })}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      ) : null}
      {okMsg ? (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
          {okMsg}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-xs text-gray-500">
        <p>
          <span className="font-medium text-gray-700">สารบัญ</span>
          {' — กรองเฉพาะโรงงานของคุณ · '}
          <code className="bg-gray-100 px-1 rounded">GET /showcases?type={activeType}</code>
        </p>
        {!loading ? (
          <span className="text-gray-700 font-semibold tabular-nums shrink-0">
            {rows.length} รายการ
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <>
          <ul className="md:hidden space-y-2" aria-label="รายการโชว์เคส">
            {rows.length === 0 ? (
              <li className="text-center text-sm text-gray-400 py-10 bg-white rounded-xl border border-gray-100">
                ยังไม่มีรายการในหมวดนี้
              </li>
            ) : (
              rows.map((r) => {
                const id = rowId(r);
                const ctype = rowContentType(r, activeType);
                return (
                  <li
                    key={id}
                    className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex gap-3 items-start min-w-0"
                  >
                    <Thumbnail src={r.image_url ? String(r.image_url) : undefined} />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 gap-y-1">
                        <TypeBadge type={ctype} />
                        <span className="text-[10px] text-gray-400 font-mono">#{id}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">
                        {String(r.title ?? '—')}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 break-words">
                        {contextDetailLine(activeType, r)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                        aria-label="แก้ไข"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(r)}
                        className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                        aria-label="ลบ"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          <div className="hidden md:block rounded-xl border border-gray-100 bg-white overflow-hidden overflow-x-auto shadow-sm">
            <table className="w-full text-sm text-left min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th scope="col" className="py-3 pl-4 pr-2 font-semibold text-gray-600 w-14">
                    รูป
                  </th>
                  <th scope="col" className="py-3 px-2 font-semibold text-gray-600 w-[108px]">
                    ประเภท
                  </th>
                  <th scope="col" className="py-3 px-2 font-semibold text-gray-600 min-w-[160px]">
                    หัวข้อ
                  </th>
                  <th scope="col" className="py-3 px-2 font-semibold text-gray-600 min-w-[200px]">
                    รายละเอียด
                  </th>
                  <th scope="col" className="py-3 pr-4 pl-2 font-semibold text-gray-600 text-right w-[104px]">
                    การกระทำ
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      ยังไม่มีรายการในหมวดนี้
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const id = rowId(r);
                    const ctype = rowContentType(r, activeType);
                    return (
                      <tr
                        key={id}
                        className="border-b border-gray-50 last:border-0 hover:bg-violet-50/40 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 align-middle">
                          <Thumbnail src={r.image_url ? String(r.image_url) : undefined} />
                        </td>
                        <td className="py-2.5 px-2 align-middle">
                          <TypeBadge type={ctype} />
                        </td>
                        <td className="py-2.5 px-2 align-middle max-w-[280px]">
                          <p className="font-semibold text-gray-900 line-clamp-2">
                            {String(r.title ?? '—')}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{id}</p>
                        </td>
                        <td className="py-2.5 px-2 align-middle text-gray-600 text-xs max-w-xs">
                          <span className="line-clamp-2 break-words">
                            {contextDetailLine(activeType, r)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 pl-2 align-middle">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(r)}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white"
                              aria-label="แก้ไข"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => void remove(r)}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                              aria-label="ลบ"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal
        >
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[min(90vh,100dvh)] overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                {modal === 'create' ? 'เพิ่มโชว์เคส' : 'แก้ไขโชว์เคส'} · {activeType}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                ปิด
              </button>
            </div>

            <label className="block">
              <span className="text-xs text-gray-500">หัวข้อ</span>
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500">
                {activeType === 'PM'
                  ? 'รายละเอียดโปร / ข้อความโปรโมชัน (รหัสส่วนลดใส่ในข้อความได้ถ้า API ยังไม่มีฟิลด์แยก)'
                  : 'คำอธิบายสั้น'}
              </span>
              <textarea
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[72px]"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-xs text-gray-500">รูปหน้าปก</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                className="mt-1 text-sm block w-full"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  e.target.value = '';
                  void onPickImage(f);
                }}
              />
              {imageUrl ? (
                <p className="text-[11px] text-gray-400 mt-1 truncate" title={imageUrl}>
                  {imageUrl}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-xs text-gray-500">หมวด (category_id)</span>
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">—</option>
                {categories.map((c) => {
                  const id = String(c.category_id ?? c.id ?? '');
                  const nm = String(c.category_name ?? c.name ?? id);
                  return (
                    <option key={id} value={id}>
                      {nm}
                    </option>
                  );
                })}
              </select>
            </label>

            {activeType === 'PD' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-500">ขั้นต่ำ (MOQ)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-500">Lead time (วัน)</span>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={leadDays}
                    onChange={(e) => setLeadDays(e.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => void submit()}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
