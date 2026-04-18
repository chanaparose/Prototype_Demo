import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import {
  factoriesApi,
  certificatesApi,
  mediaApi,
  addressesApi,
  masterApi,
  categoriesApi,
} from '../../services/api';
import { AddressList } from '../../components/factory/AddressList';
import { AddressFormModal, type AddressFormPayload } from '../../components/factory/AddressFormModal';
import { CertStatusBadge } from '../../components/factory/CertStatusBadge';
import { CertUploadModal, type CertFormSubmitValue } from '../../components/factory/CertUploadModal';

type Row = Record<string, unknown>;
type CertTypeOption = { id: number; label: string };
type FactoryTypeOption = { id: number; label: string };
type CategoryOption = { id: number; name: string };
type SubCategoryOption = { id: number; name: string; categoryId: number };

function parseCategoryOption(r: Row): CategoryOption | null {
  const id = Number(r.category_id ?? r.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const name = String(r.name ?? r.category_name ?? '').trim();
  if (!name) return null;
  return { id, name };
}

function parseSubCategoryOption(r: Row, categoryIdHint?: number): SubCategoryOption | null {
  const id = Number(r.sub_category_id ?? r.id);
  const categoryId = Number(r.category_id ?? r.parent_category_id ?? categoryIdHint);
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(categoryId) || categoryId <= 0) return null;
  const name = String(r.name ?? r.name_th ?? r.sub_category_name ?? '').trim();
  if (!name) return null;
  return { id, name, categoryId };
}

function certRowId(c: Row): string | number | null {
  const v = c.map_id ?? c.factory_certificate_id ?? c.id ?? c.cert_id;
  if (v == null || String(v).trim() === '') return null;
  return v as string | number;
}

function certTypeDisplay(c: Row, certTypes: CertTypeOption[]): string {
  const cid = Number(c.certificate_id ?? c.cert_id);
  const byMaster = certTypes.find((x) => x.id === cid)?.label;
  if (byMaster) return byMaster;
  return String(c.cert_name ?? c.name_th ?? c.name ?? c.cert_number ?? 'ใบรับรอง');
}

function certDocumentUrl(c: Row): string {
  return String(c.document_url ?? c.image_url ?? '').trim();
}

function toDateInputValue(raw: unknown): string {
  const s = String(raw ?? '').trim();
  if (!s) return '';
  return s.length >= 10 ? s.slice(0, 10) : s;
}

export function FactoryProfilePage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);

  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [factoryName, setFactoryName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [description, setDescription] = useState('');
  const [factoryTypeId, setFactoryTypeId] = useState('');
  const [factoryTypes, setFactoryTypes] = useState<FactoryTypeOption[]>([]);
  const [verifyStatus, setVerifyStatus] = useState('PD');

  const [addresses, setAddresses] = useState<Row[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'create' | 'edit'>('create');
  const [editingAddress, setEditingAddress] = useState<Row | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [certs, setCerts] = useState<Row[]>([]);
  const [masterCertTypes, setMasterCertTypes] = useState<CertTypeOption[]>([]);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [certModalMode, setCertModalMode] = useState<'create' | 'edit'>('create');
  const [editingCert, setEditingCert] = useState<Row | null>(null);
  const [savingCert, setSavingCert] = useState(false);

  const [productCategories, setProductCategories] = useState<CategoryOption[]>([]);
  const [selCatIds, setSelCatIds] = useState<number[]>([]);
  const [selSubIds, setSelSubIds] = useState<number[]>([]);
  const [subOptions, setSubOptions] = useState<SubCategoryOption[]>([]);
  const [catSubLoading, setCatSubLoading] = useState(false);
  const [savingCats, setSavingCats] = useState(false);
  const [savingSubs, setSavingSubs] = useState(false);

  const load = useCallback(async () => {
    if (fid == null) {
      setError('ไม่พบรหัสโรงงานในบัญชี — กรุณาล็อกอินใหม่');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const [factoryRow, certList, addrRes, certMaster, ftMaster, pc, fc, fsc] = await Promise.all([
        factoriesApi.get(fid),
        certificatesApi.listByFactory(fid),
        addressesApi.list().catch(() => []),
        masterApi.certificates().catch(() => []),
        masterApi.factoryTypes().catch(() => []),
        masterApi.productCategories().catch(() => []),
        factoriesApi.getCategories(fid).catch(() => []),
        factoriesApi.getSubCategories(fid).catch(() => []),
      ]);

      const f = factoryRow as Row;
      setFactoryName(String(f.factory_name ?? f.name ?? '').trim());
      setTaxId(String(f.tax_id ?? '').trim());
      setDescription(String(f.description ?? '').trim());
      const ftId = String(f.factory_type_id ?? '').trim();
      setFactoryTypeId(ftId);
      const vs = String(f.verify_status ?? '').trim().toUpperCase();
      const verified = Boolean(f.is_verified ?? f.verified);
      setVerifyStatus(vs || (verified ? 'AP' : 'PD'));

      const factoryTypeOpts = (Array.isArray(ftMaster) ? ftMaster : [])
        .map((r) => {
          const row = r as Row;
          const id = Number(row.factory_type_id ?? row.id);
          const label = String(row.name ?? row.name_th ?? row.factory_type_name ?? id);
          return { id, label };
        })
        .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.label);
      setFactoryTypes(factoryTypeOpts);

      setCerts(Array.isArray(certList) ? (certList as Row[]) : []);
      setAddresses(Array.isArray(addrRes) ? (addrRes as Row[]) : []);

      const certTypeOpts = (Array.isArray(certMaster) ? certMaster : [])
        .map((r) => {
          const row = r as Row;
          const id = Number(row.cert_id ?? row.id);
          const label = String(row.name_th ?? row.name ?? row.cert_name ?? id);
          return { id, label };
        })
        .filter((x) => Number.isFinite(x.id) && x.id > 0 && x.label);
      setMasterCertTypes(certTypeOpts);

      const categories = (Array.isArray(pc) ? pc : [])
        .map((r) => parseCategoryOption(r as Row))
        .filter((x): x is CategoryOption => x != null);
      setProductCategories(categories);

      const catIds = (Array.isArray(fc) ? fc : [])
        .map((r) => Number((r as Row).category_id ?? (r as Row).id))
        .filter((n) => Number.isFinite(n) && n > 0);
      setSelCatIds(catIds);

      const subIds = (Array.isArray(fsc) ? fsc : [])
        .map((r) => Number((r as Row).sub_category_id ?? (r as Row).id))
        .filter((n) => Number.isFinite(n) && n > 0);
      setSelSubIds(subIds);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selCatIds.length === 0) {
      setSubOptions([]);
      return;
    }
    let cancelled = false;
    setCatSubLoading(true);

    Promise.all(selCatIds.map((cid) => categoriesApi.subCategories(cid).catch(() => [])))
      .then((results) => {
        if (cancelled) return;
        const map = new Map<number, SubCategoryOption>();
        selCatIds.forEach((cid, idx) => {
          const arr = Array.isArray(results[idx]) ? (results[idx] as Row[]) : [];
          for (const row of arr) {
            const parsed = parseSubCategoryOption(row, cid);
            if (!parsed) continue;
            map.set(parsed.id, parsed);
          }
        });
        setSubOptions(
          [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'th')),
        );
      })
      .finally(() => {
        if (!cancelled) setCatSubLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selCatIds]);

  const verifyBadge = useMemo(() => {
    if (verifyStatus === 'AP') {
      return {
        className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: 'ยืนยันแล้ว (Verified)',
      };
    }
    if (verifyStatus === 'RJ') {
      return {
        className: 'bg-red-50 text-red-800 border-red-200',
        label: 'ถูกปฏิเสธ (Rejected)',
      };
    }
    return {
      className: 'bg-amber-50 text-amber-900 border-amber-200',
      label: 'รอแอดมินตรวจสอบ',
    };
  }, [verifyStatus]);

  const saveBusinessInfo = async () => {
    if (fid == null) return;
    if (!factoryName.trim()) {
      setError('กรุณากรอกชื่อโรงงาน');
      return;
    }

    setSavingBusiness(true);
    setOkMsg('');
    setError('');
    try {
      await factoriesApi.update(fid, {
        factory_name: factoryName.trim(),
        tax_id: taxId.trim() || undefined,
        description: description.trim() || undefined,
        factory_type_id: factoryTypeId ? Number(factoryTypeId) : undefined,
      });
      setOkMsg('บันทึกข้อมูลธุรกิจแล้ว');
      await refreshUser();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSavingBusiness(false);
    }
  };

  const openCreateAddress = () => {
    setAddressModalMode('create');
    setEditingAddress(null);
    setAddressModalOpen(true);
  };

  const openEditAddress = (row: Row) => {
    setAddressModalMode('edit');
    setEditingAddress(row);
    setAddressModalOpen(true);
  };

  const submitAddress = async (payload: AddressFormPayload, editingId?: string | number) => {
    setSavingAddress(true);
    setOkMsg('');
    setError('');
    try {
      if (addressModalMode === 'create') {
        await addressesApi.create(payload);
        setOkMsg('เพิ่มที่อยู่แล้ว');
      } else {
        if (editingId == null || String(editingId).trim() === '') {
          throw new Error('ไม่พบรหัสที่อยู่ที่ต้องการแก้ไข');
        }
        await addressesApi.update(editingId, payload);
        setOkMsg('บันทึกการแก้ไขที่อยู่แล้ว');
      }
      setAddressModalOpen(false);
      setEditingAddress(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกที่อยู่ไม่สำเร็จ');
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (row: Row) => {
    const addressId = row.address_id ?? row.id;
    if (addressId == null || String(addressId).trim() === '') return;
    if (!window.confirm('ลบที่อยู่นี้?')) return;
    setError('');
    setOkMsg('');
    try {
      await addressesApi.delete(addressId as string | number);
      setOkMsg('ลบที่อยู่แล้ว');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบที่อยู่ไม่สำเร็จ');
    }
  };

  const setAddressDefault = async (row: Row) => {
    const addressId = row.address_id ?? row.id;
    if (addressId == null || String(addressId).trim() === '') return;
    setError('');
    setOkMsg('');
    try {
      await addressesApi.update(addressId as string | number, { is_default: true });
      setOkMsg('ตั้งค่าเริ่มต้นแล้ว');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ตั้งค่าเริ่มต้นไม่สำเร็จ');
    }
  };

  const openCreateCert = () => {
    setCertModalMode('create');
    setEditingCert(null);
    setCertModalOpen(true);
  };

  const openEditCert = (row: Row) => {
    setCertModalMode('edit');
    setEditingCert(row);
    setCertModalOpen(true);
  };

  const submitCert = async (value: CertFormSubmitValue, keepOpen: boolean) => {
    if (fid == null) return;
    setSavingCert(true);
    setOkMsg('');
    setError('');

    try {
      let documentUrl = '';
      if (value.file) {
        const up = await mediaApi.upload(value.file);
        documentUrl = up.url;
      }

      if (certModalMode === 'create') {
        if (!documentUrl) {
          throw new Error('กรุณาอัปโหลดไฟล์เอกสาร');
        }
        await certificatesApi.create(fid, {
          cert_id: value.cert_id,
          document_url: documentUrl,
          cert_number: value.cert_number,
          expire_date: value.expire_date,
        });
        setOkMsg('เพิ่มใบรับรองแล้ว (รอตรวจสอบ)');
      } else {
        const id = certRowId(editingCert ?? {});
        if (id == null) throw new Error('ไม่พบรหัสใบรับรองที่จะแก้ไข');
        await certificatesApi.update(fid, id, {
          cert_id: value.cert_id,
          cert_number: value.cert_number,
          expire_date: value.expire_date,
          ...(documentUrl ? { document_url: documentUrl } : {}),
        });
        setOkMsg('บันทึกใบรับรองแล้ว');
      }

      await load();
      if (!keepOpen || certModalMode === 'edit') {
        setCertModalOpen(false);
        setEditingCert(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกใบรับรองไม่สำเร็จ');
    } finally {
      setSavingCert(false);
    }
  };

  const deleteCertificate = async (c: Row) => {
    if (fid == null) return;
    const delId = certRowId(c);
    if (delId == null) return;
    if (!window.confirm('ลบใบรับรองนี้?')) return;
    setError('');
    setOkMsg('');
    try {
      await certificatesApi.delete(fid, delId);
      setOkMsg('ลบใบรับรองแล้ว');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ลบใบรับรองไม่สำเร็จ');
    }
  };

  const toggleCat = (id: number) => {
    setSelCatIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const toggleSub = (id: number) => {
    setSelSubIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].sort((a, b) => a - b),
    );
  };

  const saveFactoryCategories = async () => {
    if (fid == null) return;
    setSavingCats(true);
    setOkMsg('');
    setError('');
    try {
      await factoriesApi.setCategories(fid, selCatIds);
      setOkMsg('บันทึกหมวดหมู่หลักแล้ว');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกหมวดหมู่ไม่สำเร็จ');
    } finally {
      setSavingCats(false);
    }
  };

  const saveFactorySubCategories = async () => {
    if (fid == null) return;
    setSavingSubs(true);
    setOkMsg('');
    setError('');
    try {
      await factoriesApi.setSubCategories(fid, selSubIds);
      setOkMsg('บันทึกหมวดย่อยแล้ว');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกหมวดย่อยไม่สำเร็จ');
    } finally {
      setSavingSubs(false);
    }
  };

  if (fid == null) {
    return (
      <p className="text-sm text-red-600">
        บัญชีนี้ไม่ใช่โรงงาน หรือไม่มีรหัสโรงงานในระบบ
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#A238FF', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-8 w-full min-w-0">
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

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${verifyBadge.className}`}
        >
          {verifyBadge.label}
        </span>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">ข้อมูลธุรกิจ</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">ชื่อโรงงาน *</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={factoryName}
              onChange={(e) => setFactoryName(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-500">ประเภทโรงงาน</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={factoryTypeId}
              onChange={(e) => setFactoryTypeId(e.target.value)}
            >
              <option value="">—</option>
              {factoryTypes.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-gray-500">เลขประจำตัวผู้เสียภาษี</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">รายละเอียด</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[96px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={savingBusiness}
          onClick={() => void saveBusinessInfo()}
          className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          {savingBusiness ? 'กำลังบันทึก...' : 'บันทึกข้อมูลธุรกิจ'}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">ที่อยู่</h2>
        <p className="text-xs text-gray-500 mb-4">
          จัดการผ่าน <code className="text-[11px] bg-gray-100 px-1 rounded">/addresses</code>
        </p>
        <AddressList
          addresses={addresses}
          onCreate={openCreateAddress}
          onEdit={openEditAddress}
          onDelete={(row) => void deleteAddress(row)}
          onSetDefault={(row) => void setAddressDefault(row)}
        />
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">หมวดสินค้าของโรงงาน</h2>
        <p className="text-xs text-gray-500 mb-3">
          <code className="text-[11px] bg-gray-100 px-1 rounded">GET/POST /factories/…/categories</code>
          {' · '}
          <code className="text-[11px] bg-gray-100 px-1 rounded">…/sub-categories</code>
        </p>

        <p className="text-xs font-semibold text-gray-700 mb-2">หมวดหลัก</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {productCategories.length === 0 ? (
            <span className="text-sm text-gray-400">ไม่มีรายการหมวดจาก master หรือโหลดไม่สำเร็จ</span>
          ) : (
            productCategories.map((c) => (
              <label
                key={c.id}
                className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selCatIds.includes(c.id)}
                  onChange={() => toggleCat(c.id)}
                  className="rounded border-gray-300 text-[#A238FF] focus:ring-[#A238FF]"
                />
                <span>{c.name}</span>
              </label>
            ))
          )}
        </div>

        <button
          type="button"
          disabled={savingCats}
          onClick={() => void saveFactoryCategories()}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 mb-6"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          {savingCats ? 'กำลังบันทึก...' : 'บันทึกหมวดหลัก'}
        </button>

        <p className="text-xs font-semibold text-gray-700 mb-2">หมวดย่อย (ตามหมวดหลักที่เลือก)</p>
        {catSubLoading ? <p className="text-sm text-gray-400 mb-2">กำลังโหลดหมวดย่อย…</p> : null}

        <div className="flex flex-wrap gap-2 mb-3">
          {subOptions.length === 0 ? (
            <span className="text-sm text-gray-400">
              {selCatIds.length === 0 ? 'เลือกหมวดหลักอย่างน้อย 1 รายการ' : 'ไม่มีหมวดย่อยหรือยังโหลดไม่สำเร็จ'}
            </span>
          ) : (
            subOptions.map((s) => (
              <label
                key={s.id}
                className="inline-flex items-center gap-2 text-sm border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selSubIds.includes(s.id)}
                  onChange={() => toggleSub(s.id)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span>
                  {s.name}
                  <span className="text-gray-400 text-[10px] ml-1">(cat {s.categoryId})</span>
                </span>
              </label>
            ))
          )}
        </div>

        <button
          type="button"
          disabled={savingSubs || subOptions.length === 0}
          onClick={() => void saveFactorySubCategories()}
          className="px-4 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)' }}
        >
          {savingSubs ? 'กำลังบันทึก...' : 'บันทึกหมวดย่อย'}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">ใบรับรอง</h2>
            <p className="text-xs text-gray-500 mt-0.5">รองรับหลายใบรับรองต่อโรงงาน (1:N)</p>
          </div>
          <button
            type="button"
            onClick={openCreateCert}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
          >
            <Plus size={16} />
            เพิ่มใบรับรอง
          </button>
        </div>

        <ul className="space-y-2">
          {certs.length === 0 ? (
            <li className="text-sm text-gray-400">ยังไม่มีใบรับรอง</li>
          ) : (
            certs.map((c, i) => {
              const key = String(certRowId(c) ?? i);
              const docUrl = certDocumentUrl(c);
              const expire = toDateInputValue(c.expire_date);
              return (
                <li
                  key={key}
                  className="text-sm border border-gray-100 rounded-xl px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">{certTypeDisplay(c, masterCertTypes)}</span>
                      <CertStatusBadge status={String(c.verify_status ?? c.status ?? 'PD')} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      เลขที่เอกสาร: {String(c.cert_number ?? '—')}
                      {' · '}
                      หมดอายุ: {expire || '—'}
                    </p>
                    {docUrl ? (
                      <p className="text-xs text-gray-500 mt-0.5 truncate" title={docUrl}>
                        {docUrl}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {docUrl ? (
                      <a
                        href={docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Download size={13} />
                        ดาวน์โหลดเอกสาร
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openEditCert(c)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                      aria-label="แก้ไขใบรับรอง"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteCertificate(c)}
                      className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50"
                      aria-label="ลบใบรับรอง"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </section>

      <AddressFormModal
        open={addressModalOpen}
        mode={addressModalMode}
        initial={editingAddress}
        saving={savingAddress}
        onClose={() => {
          if (savingAddress) return;
          setAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={submitAddress}
      />

      <CertUploadModal
        open={certModalOpen}
        mode={certModalMode}
        certTypes={masterCertTypes}
        initial={editingCert}
        submitting={savingCert}
        onClose={() => {
          if (savingCert) return;
          setCertModalOpen(false);
          setEditingCert(null);
        }}
        onSubmit={submitCert}
      />
    </div>
  );
}
