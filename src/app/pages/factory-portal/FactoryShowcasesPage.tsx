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
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase">GET /showcases?type=…</p>
          <h2 className="text-lg font-bold text-gray-900">จัดการโชว์เคส</h2>
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

      {/* Section tabs — แต่ละแท็บยิง type แยกตามสเปก */}
      <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl w-fit max-w-full">
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

      <p className="text-xs text-gray-500">
        โหลดรายการด้วย <code className="bg-gray-100 px-1 rounded">GET /showcases?type={activeType}</code>{' '}
        แล้วกรองเฉพาะโรงงานของคุณ
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.length === 0 ? (
            <li className="col-span-full text-center text-sm text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
              ยังไม่มีรายการในหมวดนี้
            </li>
          ) : (
            rows.map((r) => (
              <li
                key={rowId(r)}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex flex-col"
              >
                <div className="aspect-[16/10] bg-gray-100 relative">
                  {r.image_url ? (
                    <img
                      src={String(r.image_url)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={40} strokeWidth={1.2} />
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-semibold text-gray-900 line-clamp-2">{String(r.title ?? '')}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {String(r.excerpt ?? '') || '—'}
                  </p>
                  {activeType === 'PD' ? (
                    <p className="text-[11px] text-gray-400 mt-2">
                      MOQ {String(r.min_order ?? '—')} · Lead {String(r.lead_time_days ?? '—')} วัน
                    </p>
                  ) : null}
                  <div className="flex gap-2 mt-3 mt-auto pt-2">
                    <button
                      type="button"
                      onClick={() => openEdit(r)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={14} />
                      แก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(r)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium border border-red-100 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      {modal ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4">
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
              <div className="grid grid-cols-2 gap-3">
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
