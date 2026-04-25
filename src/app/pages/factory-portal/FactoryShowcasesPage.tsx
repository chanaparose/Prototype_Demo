import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Pencil, Trash2, ImageIcon, SquareArrowOutUpRight, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { showcasesApi, mediaApi, factoriesApi, categoriesApi } from '../../services/api';

type Row = Record<string, unknown>;
type CategoryOption = { id: number; name: string };
type SubCategoryOption = { id: number; name: string; categoryId: number };
type ShowcaseStatus = 'DR' | 'AC' | 'HI' | 'AR';
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

function rowId(r: Row): string {
  return String(r.showcase_id ?? r.id ?? '');
}

function parseCategoryOption(r: Row): CategoryOption | null {
  const id = Number(r.category_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(r.category_name ?? r.name ?? r.name_th ?? id).trim();
  if (!name) return null;
  return { id, name };
}

function parseSubCategoryOption(r: Row): SubCategoryOption | null {
  const id = Number(r.sub_category_id ?? r.id);
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? r.categoryId);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (!Number.isFinite(categoryId) || categoryId <= 0) return null;
  const name = String(r.sub_category_name ?? r.name ?? r.name_th ?? id).trim();
  if (!name) return null;
  return { id, name, categoryId };
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

function firstImage(row: Row): string | undefined {
  const images = parseImageUrls(row.images ?? row.image_urls ?? row.imageUrls);
  if (images.length > 0) return images[0];
  const fallback = String(row.image_url ?? '').trim();
  return fallback || undefined;
}

function contextLine(row: Row): string {
  const moq = Number(row.moq ?? row.min_order ?? 0);
  const lead = Number(row.lead_time_days ?? 0);
  const basePrice = Number(row.base_price ?? 0);
  const parts = [
    moq > 0 ? `MOQ ${moq}` : 'MOQ -',
    lead > 0 ? `Lead ${lead} วัน` : 'Lead -',
    basePrice > 0 ? `เริ่ม ฿${basePrice.toLocaleString('th-TH')}` : 'ราคา -',
  ];
  return parts.join(' · ');
}

function Thumbnail({ src }: { src: string | undefined }) {
  return (
    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gray-100 border border-gray-100 overflow-hidden shrink-0 flex items-center justify-center" aria-hidden>
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="text-gray-300" size={20} strokeWidth={1.5} />}
    </div>
  );
}

export function FactoryShowcasesPage() {
  const { user } = useAuth();
  const fid = getFactoryEntityId(user);
  const navigate = useNavigate();

  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [factorySubCategories, setFactorySubCategories] = useState<SubCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [moq, setMoq] = useState('');
  const [leadDays, setLeadDays] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [status, setStatus] = useState<ShowcaseStatus>('DR');
  const [uploading, setUploading] = useState(false);
  const [contentTab, setContentTab] = useState<EditorTab>('write');

  const load = useCallback(async () => {
    if (fid == null) {
      setError('ไม่พบรหัสโรงงานในบัญชี');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [rawList, catsRaw, assignedSubsRaw] = await Promise.all([
        showcasesApi.listByFactory(fid, 'PD'),
        factoriesApi.getCategories(fid).catch(() => []),
        factoriesApi.getSubCategories(fid).catch(() => []),
      ]);
      setRows((Array.isArray(rawList) ? rawList : []) as Row[]);

      const cats = (Array.isArray(catsRaw) ? catsRaw : [])
        .map((r) => parseCategoryOption(r as Row))
        .filter((x): x is CategoryOption => x != null);
      setCategories(cats);

      const assignedSubRows = (Array.isArray(assignedSubsRaw) ? assignedSubsRaw : []) as Row[];
      const assignedSubIds = new Set<number>();
      const subMap = new Map<number, SubCategoryOption>();
      for (const row of assignedSubRows) {
        const sid = Number(row.sub_category_id ?? row.id);
        if (Number.isFinite(sid) && sid > 0) assignedSubIds.add(sid);
        const parsed = parseSubCategoryOption(row);
        if (parsed) subMap.set(parsed.id, parsed);
      }

      await Promise.all(
        cats.map(async (cat) => {
          const raw = await categoriesApi.subCategories(cat.id).catch(() => []);
          const subRows = (Array.isArray(raw) ? raw : []) as Row[];
          for (const row of subRows) {
            const parsed = parseSubCategoryOption({ ...row, category_id: cat.id });
            if (!parsed) continue;
            if (assignedSubIds.size === 0 || assignedSubIds.has(parsed.id)) {
              subMap.set(parsed.id, parsed);
            }
          }
        }),
      );

      setFactorySubCategories([...subMap.values()].sort((a, b) => a.name.localeCompare(b.name, 'th')));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดโชว์เคสไม่สำเร็จ');
      setRows([]);
      setCategories([]);
      setFactorySubCategories([]);
    } finally {
      setLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSubCategories = useMemo(() => {
    const cid = Number(categoryId);
    if (!Number.isFinite(cid) || cid <= 0) return [];
    return factorySubCategories.filter((s) => s.categoryId === cid);
  }, [factorySubCategories, categoryId]);

  useEffect(() => {
    if (!subCategoryId) return;
    const found = filteredSubCategories.some((s) => String(s.id) === subCategoryId);
    if (!found) setSubCategoryId('');
  }, [filteredSubCategories, subCategoryId]);

  const resetForm = () => {
    setTitle('');
    setExcerpt('');
    setContent('');
    setImageUrls([]);
    setCategoryId('');
    setSubCategoryId('');
    setMoq('');
    setLeadDays('');
    setBasePrice('');
    setProductionCapacity('');
    setSampleAvailable(false);
    setStatus('DR');
    setContentTab('write');
  };

  const openCreate = () => {
    if (categories.length === 0) return;
    setEditing(null);
    resetForm();
    setModal('create');
    setOkMsg('');
  };

  const openEdit = (r: Row) => {
    setEditing(r);
    setTitle(String(r.title ?? ''));
    setExcerpt(String(r.excerpt ?? ''));
    setContent(String(r.content ?? r.description ?? ''));
    setImageUrls(parseImageUrls(r.images ?? r.image_urls ?? r.imageUrls));
    setCategoryId(r.category_id != null && r.category_id !== '' ? String(r.category_id) : '');
    const subRaw = r.sub_category_id ?? r.subCategoryId;
    setSubCategoryId(subRaw != null && String(subRaw).trim() !== '' ? String(subRaw) : '');
    setMoq(r.moq != null ? String(r.moq) : r.min_order != null ? String(r.min_order) : '');
    setLeadDays(r.lead_time_days != null ? String(r.lead_time_days) : '');
    setBasePrice(r.base_price != null ? String(r.base_price) : '');
    const st = String(r.status ?? 'DR').toUpperCase();
    setStatus(st === 'AC' || st === 'HI' || st === 'AR' ? st : 'DR');
    setModal('edit');
    setContentTab('write');
    setOkMsg('');
  };

  const closeModal = () => {
    setModal(null);
    setEditing(null);
  };

  const onPickImage = async (file: File | null) => {
    if (!file || imageUrls.length >= 5) return;
    setUploading(true);
    setError('');
    try {
      const up = await mediaApi.upload(file);
      const url = String(up.url ?? '').trim();
      if (!url) return;
      setImageUrls((prev) => {
        if (prev.includes(url)) return prev;
        return [...prev, url].slice(0, 5);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  const removeImageAt = (idx: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      content_type: 'PD',
      status,
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim() || undefined,
      image_url: imageUrls[0] ?? undefined,
      category_id: categoryId ? Number(categoryId) : undefined,
      sub_category_id: subCategoryId ? Number(subCategoryId) : undefined,
      moq: moq ? Number(moq) : undefined,
      lead_time_days: leadDays ? Number(leadDays) : undefined,
      base_price: basePrice ? Number(basePrice) : undefined,
      linked_showcases: [],
    };
    return payload;
  };

  const submit = async () => {
    if (!title.trim()) {
      setError('กรุณากรอกหัวข้อ');
      return;
    }
    if (!subCategoryId) {
      setError('กรุณาเลือกหมวดหมู่ย่อยของสินค้า');
      return;
    }
    if (imageUrls.length > 5) {
      setError('อัปโหลดรูปได้สูงสุด 5 รูป');
      return;
    }

    setSaving(true);
    setError('');
    setOkMsg('');
    try {
      const payload = buildPayload();
      if (modal === 'create') {
        await showcasesApi.create(payload as Parameters<typeof showcasesApi.create>[0]);
        setOkMsg('สร้างสินค้าโชว์เคสแล้ว');
      } else if (modal === 'edit' && editing) {
        await showcasesApi.update(rowId(editing), payload);
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
      setError(e instanceof Error ? e.message : 'ลบไม่สำเร็จ');
    }
  };

  if (fid == null) {
    return <p className="text-sm text-red-600">บัญชีนี้ไม่ใช่โรงงาน</p>;
  }

  return (
    <div className="space-y-5 sm:space-y-6 pb-10 sm:pb-12 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] text-gray-400 uppercase">Shopee-style Product Showcase (PD)</p>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">จัดการสินค้าโชว์เคส</h2>
          <p className="text-xs text-gray-500 mt-1">โหมดนี้แสดงเฉพาะสินค้า `PD` (no promotion)</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={categories.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)' }}
        >
          <Plus size={18} />
          เพิ่มสินค้า
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          คุณยังไม่ได้เลือกหมวดหมู่สินค้าในโปรไฟล์ —{' '}
          <button type="button" onClick={() => navigate('/factory/profile')} className="underline underline-offset-2 font-semibold">
            ไปที่โปรไฟล์
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p> : null}
      {okMsg ? <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">{okMsg}</p> : null}

      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 text-xs text-gray-500">
        <p>
          <span className="font-medium text-gray-700">สินค้าโรงงานของคุณ</span>
          {' · '}
          <code className="bg-gray-100 px-1 rounded">GET /showcases?type=PD&factory_id=me</code>
        </p>
        {!loading ? <span className="text-gray-700 font-semibold tabular-nums shrink-0">{rows.length} รายการ</span> : null}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F97316', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <>
          <ul className="md:hidden space-y-2" aria-label="รายการโชว์เคสสินค้า">
            {rows.length === 0 ? (
              <li className="text-center text-sm text-gray-400 py-10 bg-white rounded-xl border border-gray-100">ยังไม่มีรายการสินค้า</li>
            ) : (
              rows.map((r) => {
                const id = rowId(r);
                return (
                  <li key={id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 flex gap-3 items-start min-w-0">
                    <Thumbnail src={firstImage(r)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2">{String(r.title ?? '—')}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 break-words">{contextLine(r)}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">#{id}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button type="button" onClick={() => navigate(`/factory/showcases/${id}/edit`)} className="p-2 rounded-lg border border-orange-100 text-orange-700 hover:bg-orange-50" aria-label="แก้ไขแบบเต็มหน้า" title="แก้ไขแบบเต็มหน้า">
                        <SquareArrowOutUpRight size={16} />
                      </button>
                      <button type="button" onClick={() => openEdit(r)} className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50" aria-label="แก้ไขด่วน">
                        <Pencil size={16} />
                      </button>
                      <button type="button" onClick={() => void remove(r)} className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50" aria-label="ลบ">
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
                  <th scope="col" className="py-3 pl-4 pr-2 font-semibold text-gray-600 w-14">รูป</th>
                  <th scope="col" className="py-3 px-2 font-semibold text-gray-600 min-w-[220px]">สินค้า</th>
                  <th scope="col" className="py-3 px-2 font-semibold text-gray-600 min-w-[240px]">ข้อมูลหลัก</th>
                  <th scope="col" className="py-3 pr-4 pl-2 font-semibold text-gray-600 text-right w-[120px]">การกระทำ</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">ยังไม่มีรายการสินค้า</td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const id = rowId(r);
                    return (
                      <tr key={id} className="border-b border-gray-50 last:border-0 hover:bg-orange-50/40 transition-colors">
                        <td className="py-2.5 pl-4 pr-2 align-middle">
                          <Thumbnail src={firstImage(r)} />
                        </td>
                        <td className="py-2.5 px-2 align-middle max-w-[280px]">
                          <p className="font-semibold text-gray-900 line-clamp-2">{String(r.title ?? '—')}</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{id}</p>
                        </td>
                        <td className="py-2.5 px-2 align-middle text-gray-600 text-xs max-w-xs">
                          <span className="line-clamp-2 break-words">{contextLine(r)}</span>
                        </td>
                        <td className="py-2.5 pr-4 pl-2 align-middle">
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => navigate(`/factory/showcases/${id}/edit`)} className="inline-flex items-center justify-center p-2 rounded-lg border border-orange-100 text-orange-700 hover:bg-orange-50" aria-label="แก้ไขแบบเต็มหน้า" title="แก้ไขแบบเต็มหน้า">
                              <SquareArrowOutUpRight size={16} />
                            </button>
                            <button type="button" onClick={() => openEdit(r)} className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white" aria-label="แก้ไขด่วน">
                              <Pencil size={16} />
                            </button>
                            <button type="button" onClick={() => void remove(r)} className="inline-flex items-center justify-center p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50" aria-label="ลบ">
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40" role="dialog" aria-modal>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[min(90vh,100dvh)] overflow-y-auto p-4 sm:p-5 pb-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-gray-900">{modal === 'create' ? 'เพิ่มสินค้าโชว์เคส' : 'แก้ไขสินค้าโชว์เคส'}</h3>
              <button type="button" onClick={closeModal} className="text-sm text-gray-500 hover:text-gray-800">ปิด</button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-xs text-gray-500">หัวข้อ *</span>
                <input className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
              </label>

              <label className="block sm:col-span-2">
                <span className="text-xs text-gray-500">คำอธิบายสั้น</span>
                <textarea className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[72px]" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              </label>

              <label className="block sm:col-span-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">รายละเอียดสินค้า (Markdown)</span>
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
                      onClick={() => setContent((prev) => (prev.trim() ? prev : PRODUCT_MARKDOWN_TEMPLATE))}
                    >
                      ใช้ตัวอย่าง
                    </button>
                  </div>
                </div>
                {contentTab === 'write' ? (
                  <textarea
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[180px] font-mono"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                ) : (
                  <div className="mt-1 rounded-xl border border-gray-200 bg-white px-4 py-3 min-h-[180px]">
                    {content.trim() ? (
                      <div className="prose prose-sm max-w-none prose-p:text-[13px] prose-li:text-[13px] prose-headings:text-[15px] prose-strong:text-inherit prose-strong:font-semibold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                          {normalizeMarkdownContent(content)}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">ยังไม่มีเนื้อหาให้แสดงตัวอย่าง</p>
                    )}
                  </div>
                )}
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">หมวด (category_id)</span>
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">หมวดย่อย (sub_category_id) *</span>
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:opacity-60" value={subCategoryId} onChange={(e) => setSubCategoryId(e.target.value)} disabled={!categoryId}>
                  <option value="">— เลือกหมวดย่อย —</option>
                  {filteredSubCategories.map((s) => (
                    <option key={String(s.id)} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">MOQ</span>
                <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={moq} onChange={(e) => setMoq(e.target.value)} />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">Lead time (วัน)</span>
                <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={leadDays} onChange={(e) => setLeadDays(e.target.value)} />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">ราคาเริ่มต้น (base_price)</span>
                <input type="number" className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
              </label>

              <label className="block">
                <span className="text-xs text-gray-500">สถานะ</span>
                <select className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as ShowcaseStatus)}>
                  <option value="DR">Draft</option>
                  <option value="AC">Active</option>
                  <option value="HI">Hidden</option>
                  <option value="AR">Archived</option>
                </select>
              </label>

              <div className="sm:col-span-2 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">รูปสินค้า (สูงสุด 5 รูป)</span>
                  <label className="text-xs text-orange-700 font-semibold cursor-pointer">
                    + เพิ่มรูป
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading || imageUrls.length >= 5}
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = '';
                        void onPickImage(f);
                      }}
                    />
                  </label>
                </div>
                <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {imageUrls.map((url, idx) => (
                    <div key={`${url}-${idx}`} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeImageAt(idx)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center" aria-label="ลบรูป">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {imageUrls.length === 0 ? <p className="text-xs text-gray-400 col-span-full">ยังไม่มีรูป</p> : null}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" disabled={saving} onClick={() => void submit()} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)' }}>
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button type="button" onClick={closeModal} className="px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700">ยกเลิก</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
