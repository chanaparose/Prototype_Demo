import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { profileApi } from '@/services/api';
import { useAuth } from '@/stores';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
    address_line1: '',
    sub_district: '',
    district: '',
    province: '',
    postal_code: '',
    description: '',
    specialization: '',
    min_order: '',
    lead_time_desc: '',
    price_range: '',
  });

  useEffect(() => {
    let mounted = true;
    void profileApi
      .get()
      .then((p) => {
        if (!mounted) return;
        const addr = (p.address ?? {}) as Record<string, unknown>;
        setAvatarPreview(String(p.avatar_url ?? ''));
        setRole(String(p.role ?? user?.role ?? ''));
        setForm({
          first_name: String(p.first_name ?? ''),
          last_name: String(p.last_name ?? ''),
          phone: String(p.phone ?? ''),
          bio: String(p.bio ?? ''),
          address_line1: String(p.address_line1 ?? addr.address_line1 ?? ''),
          sub_district: String(p.sub_district ?? addr.sub_district ?? ''),
          district: String(p.district ?? addr.district ?? ''),
          province: String(p.province ?? addr.province ?? ''),
          postal_code: String(p.postal_code ?? addr.postal_code ?? ''),
          description: String(p.description ?? ''),
          specialization: String(p.specialization ?? ''),
          min_order: String(p.min_order ?? ''),
          lead_time_desc: String(p.lead_time_desc ?? ''),
          price_range: String(p.price_range ?? ''),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async () => {
    const currentRole = String(role || user?.role || '').toUpperCase();
    if (currentRole === 'CT' && (!form.first_name.trim() || !form.last_name.trim())) {
      setError('กรุณากรอกชื่อและนามสกุล');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (avatarFile) await profileApi.uploadAvatar(avatarFile);
      await profileApi.update({ ...form, bio: form.bio.slice(0, 300) });
      navigate('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className='p-4 text-sm text-gray-500'>กำลังโหลด...</div>;

  return (
    <div className='space-y-4 pb-24'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-slate-600'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-slate-900'>แก้ไขโปรไฟล์</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void onSave()}
          disabled={saving}
          className='text-xs font-semibold text-indigo-600 disabled:opacity-50'
        >
          บันทึก
        </Button>
      </div>

      {error ? (
        <p className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2'>
          {error}
        </p>
      ) : null}

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
        <div className='flex items-center gap-3'>
          <img
            src={avatarPreview || '/assets/avatars/customer-default.svg'}
            alt='avatar'
            className='w-14 h-14 rounded-2xl object-cover bg-slate-100'
          />
          <label className='text-xs font-semibold text-indigo-600 cursor-pointer'>
            เปลี่ยนรูปโปรไฟล์
            <Input
              type='file'
              accept='image/*'
              className='hidden'
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setAvatarFile(f);
                if (f) setAvatarPreview(URL.createObjectURL(f));
              }}
            />
          </label>
        </div>

        {[
          ['เบอร์โทร', 'phone'],
          ...(String(role || user?.role || '').toUpperCase() === 'FT'
            ? [
                ['รายละเอียดโรงงาน', 'description'],
                ['ความเชี่ยวชาญ', 'specialization'],
                ['ขั้นต่ำการผลิต (MOQ)', 'min_order'],
                ['Lead Time', 'lead_time_desc'],
                ['ช่วงราคา', 'price_range'],
              ]
            : [
                ['ชื่อ', 'first_name'],
                ['นามสกุล', 'last_name'],
                ['บ้านเลขที่/ถนน', 'address_line1'],
                ['ตำบล/แขวง', 'sub_district'],
                ['อำเภอ/เขต', 'district'],
                ['จังหวัด', 'province'],
                ['รหัสไปรษณีย์', 'postal_code'],
              ]),
        ].map(([label, key]) => (
          <label key={key} className='block'>
            <span className='text-xs text-slate-500'>{label}</span>
            <Input
              value={(form as Record<string, string>)[key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
              className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
            />
          </label>
        ))}

        <label className='block'>
          <span className='text-xs text-slate-500'>บันทึกย่อ</span>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value.slice(0, 300) }))}
            rows={3}
            className='mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
          />
          <p className='text-[11px] text-slate-400 text-right'>{form.bio.length}/300</p>
        </label>
      </div>
    </div>
  );
}
