import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFactoryEntityId } from '../../utils/factoryUser';
import { factoriesApi, certificatesApi, mediaApi } from '../../services/api';

export function FactoryProfilePage() {
  const { user, refreshUser } = useAuth();
  const fid = getFactoryEntityId(user);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const [certs, setCerts] = useState<Record<string, unknown>[]>([]);
  const [certIdInput, setCertIdInput] = useState('1');
  const [certNumber, setCertNumber] = useState('');
  const [certExpire, setCertExpire] = useState('');
  const [certUploading, setCertUploading] = useState(false);

  const load = useCallback(async () => {
    if (fid == null) {
      setError('ไม่พบรหัสโรงงานในบัญชี — กรุณาล็อกอินใหม่');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [factoryRow, certList] = await Promise.all([
        factoriesApi.get(fid),
        certificatesApi.listByFactory(fid),
      ]);

      const f = factoryRow as Record<string, unknown>;
      setName(String(f.name ?? ''));
      setEmail(String(f.email ?? user?.email ?? ''));
      setPhone(String(f.phone ?? user?.phone ?? ''));
      setAddress(String(f.address ?? ''));
      setDescription(String(f.description ?? ''));

      setCerts(Array.isArray(certList) ? (certList as Record<string, unknown>[]) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [fid, user?.email, user?.phone]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async () => {
    if (fid == null) return;
    setSaving(true);
    setOkMsg('');
    setError('');
    try {
      await factoriesApi.update(fid, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        description: description.trim(),
      });
      setOkMsg('บันทึกโปรไฟล์แล้ว');
      await refreshUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const addCertificate = async (file: File | null) => {
    if (fid == null || !file) return;
    setCertUploading(true);
    setError('');
    try {
      const up = await mediaApi.upload(file);
      const certId = Number(certIdInput) || 1;
      await certificatesApi.create(fid, {
        cert_id: certId,
        document_url: up.url,
        cert_number: certNumber.trim() || undefined,
        expire_date: certExpire.trim() || undefined,
      });
      setCertNumber('');
      setCertExpire('');
      setOkMsg('อัปโหลดใบรับรองแล้ว (รอแอดมินตรวจสอบ)');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'อัปโหลดใบรับรองไม่สำเร็จ');
    } finally {
      setCertUploading(false);
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
    <div className="space-y-8 pb-8">
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

      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">ข้อมูลโรงงาน</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">ชื่อโรงงาน</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">อีเมล</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">โทรศัพท์</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">ที่อยู่</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs text-gray-500">รายละเอียด</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[88px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveProfile()}
          className="mt-4 px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #A238FF 0%, #7C3AED 100%)' }}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
        </button>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-2">ใบรับรอง</h2>
        <p className="text-xs text-gray-500 mb-4">
          อัปโหลด PDF/รูป — สถานะตรวจสอบจะถูกจัดการโดยแอดมินตาม API
        </p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="block">
            <span className="text-xs text-gray-500">รหัสประเภทใบรับรอง (cert_id)</span>
            <input
              className="mt-1 w-28 rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={certIdInput}
              onChange={(e) => setCertIdInput(e.target.value)}
            />
          </label>
          <label className="block flex-1 min-w-[140px]">
            <span className="text-xs text-gray-500">เลขที่เอกสาร</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
            />
          </label>
          <label className="block flex-1 min-w-[140px]">
            <span className="text-xs text-gray-500">วันหมดอายุ (YYYY-MM-DD)</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              value={certExpire}
              onChange={(e) => setCertExpire(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500">ไฟล์</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="mt-1 text-sm"
              disabled={certUploading}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                e.target.value = '';
                void addCertificate(f);
              }}
            />
          </label>
        </div>
        <ul className="mt-4 space-y-2">
          {certs.length === 0 ? (
            <li className="text-sm text-gray-400">ยังไม่มีใบรับรอง</li>
          ) : (
            certs.map((c, i) => (
              <li
                key={String(c.map_id ?? c.cert_id ?? i)}
                className="text-sm border border-gray-100 rounded-xl px-3 py-2 flex flex-wrap gap-2 justify-between"
              >
                <span className="text-gray-700 truncate max-w-[200px]">
                  {String(c.cert_number ?? c.document_url ?? 'เอกสาร')}
                </span>
                <span className="text-gray-400 text-xs">
                  {String(c.verify_status ?? c.status ?? '—')}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
