import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { profileApi } from '@/services/api/userApi';
import {
  authChangePasswordSchema,
  type AuthChangePasswordFormValues,
} from '@/domain/auth/schemas/authForm.schema';
import { toFormErrors } from '@/lib/apiError';
import { runAsyncAction } from '@/utils/asyncAction';
import { APP_ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const FIELDS: Array<{
  name: keyof AuthChangePasswordFormValues;
  label: string;
  vis: 'c' | 'n' | 'cf';
}> = [
  { name: 'current_password', label: 'รหัสผ่านปัจจุบัน', vis: 'c' },
  { name: 'new_password', label: 'รหัสผ่านใหม่', vis: 'n' },
  { name: 'confirm_password', label: 'ยืนยันรหัสผ่านใหม่', vis: 'cf' },
];

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const [show, setShow] = useState({ c: false, n: false, cf: false });
  const [saving, setSaving] = useState(false);
  const [rootError, setRootError] = useState('');

  const form = useForm<AuthChangePasswordFormValues>({
    resolver: zodResolver(authChangePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onSubmit',
  });

  const newPassword = form.watch('new_password');
  const strength = useMemo(() => {
    const p = newPassword;
    let s = 0;
    if (p.length >= 8) s += 1;
    if (/[A-Z]/.test(p)) s += 1;
    if (/\d/.test(p)) s += 1;
    if (/[^A-Za-z0-9]/.test(p)) s += 1;
    return s;
  }, [newPassword]);

  const onSubmit = async (values: AuthChangePasswordFormValues) => {
    await runAsyncAction(async () => {
      await profileApi.changePassword(values);
      navigate(APP_ROUTES.profile);
    }, {
      onStart: () => {
        setSaving(true);
        setRootError('');
      },
      onError: (_message, error) => {
        const { root, fields } = toFormErrors(error);
        if (root) setRootError(root);
        const fieldErrors = fields ?? {};
        for (const [key, message] of Object.entries(fieldErrors)) {
          form.setError(key as keyof AuthChangePasswordFormValues, { message });
        }
        if (!root && Object.keys(fieldErrors).length === 0) {
          setRootError(_message);
        }
      },
      onSettled: () => setSaving(false),
      fallbackMessage: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
    });
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
      {rootError ? <ErrorAlert size='sm'>{rootError}</ErrorAlert> : null}

      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'
        >
          {FIELDS.map(({ name, label, vis }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs text-slate-500'>{label}</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type={show[vis] ? 'text' : 'password'}
                        className='w-full rounded-xl border border-slate-200 px-3 py-2 pr-9 text-sm'
                        {...field}
                      />
                      <Button
                        variant='unstyled'
                        type='button'
                        title='แสดง/ซ่อนรหัสผ่าน'
                        onClick={() => setShow((p) => ({ ...p, [vis]: !p[vis] }))}
                        className='absolute right-2 top-2 text-slate-400'
                      >
                        {show[vis] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            type='submit'
            disabled={saving}
            className='w-full py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50'
          >
            {saving ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
