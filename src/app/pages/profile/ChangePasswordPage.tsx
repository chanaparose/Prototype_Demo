import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { profileApi } from '@/services/api';
import { Button } from '@/components/ui/button';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState({ c: false, n: false, cf: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const strength = useMemo(() => {
    const p = form.new_password;
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Z]/.test(p)) s += 1;
    if (/\d/.test(p)) s += 1;
    if (/[^A-Za-z0-9]/.test(p)) s += 1;
    return s;
  }, [form.new_password]);

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      await profileApi.changePassword(form);
      navigate('/profile');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='space-y-4 pb-24'>
      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-2'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-slate-600'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-slate-900'>เปลี่ยนรหัสผ่าน</p>
      </div>
      {error ? (
        <p className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2'>
          {error}
        </p>
      ) : null}

      <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'>
        {[
          ['รหัสผ่านปัจจุบัน', 'current_password', 'c'],
          ['รหัสผ่านใหม่', 'new_password', 'n'],
          ['ยืนยันรหัสผ่านใหม่', 'confirm_password', 'cf'],
        ].map(([label, key, vis]) => (
          <label key={key} className='block'>
            <span className='text-xs text-slate-500'>{label}</span>
            <div className='mt-1 relative'>
              <input
                type={show[vis as 'c' | 'n' | 'cf'] ? 'text' : 'password'}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                className='w-full rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm'
              />
              <Button
                variant='unstyled'
                type='button'
                title='แสดง/ซ่อนรหัสผ่าน'
                onClick={() => setShow((p) => ({ ...p, [vis]: !p[vis as 'c' | 'n' | 'cf'] }))}
                className='absolute right-2 top-2 text-slate-400'
              >
                {show[vis as 'c' | 'n' | 'cf'] ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </label>
        ))}

        <div>
          <p className='text-xs text-slate-500 mb-1'>ความปลอดภัยรหัสผ่าน</p>
          <div className='grid grid-cols-4 gap-1'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded ${i < strength ? 'bg-emerald-500' : 'bg-slate-200'}`}
              />
            ))}
          </div>
        </div>

        <Button
          variant='unstyled'
          type='button'
          onClick={() => void submit()}
          disabled={saving}
          className='w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50'
        >
          {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
        </Button>
      </div>
    </div>
  );
}
