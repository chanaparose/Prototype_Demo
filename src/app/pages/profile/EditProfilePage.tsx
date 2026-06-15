import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { profileApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { resolveCustomerAvatarSrc } from '@/utils/customerAvatar';
import {
  profileEditFormSchema,
  validateProfileEditForRole,
  type ProfileEditFormValues,
} from '@/domain/profile/schemas/profileEditForm.schema';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image } from '@/components/ui/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const FACTORY_PROFILE_FALLBACK_AVATAR_SRC = '/assets/avatars/factory-fallback.svg';

const emptyValues: ProfileEditFormValues = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  description: '',
  specialization: '',
  lead_time_desc: '',
  price_range: '',
};

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rootError, setRootError] = useState('');
  const [role, setRole] = useState('');

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: emptyValues,
    mode: 'onSubmit',
  });

  const isFactory = String(role || user?.role || '').toUpperCase() === 'FT';
  const profileAvatarSrc = isFactory
    ? FACTORY_PROFILE_FALLBACK_AVATAR_SRC
    : resolveCustomerAvatarSrc(user?.id, 112);

  useEffect(() => {
    let mounted = true;
    void profileApi
      .get()
      .then((p) => {
        if (!mounted) return;
        setRole(String(p.role ?? user?.role ?? ''));
        form.reset({
          first_name: String(p.first_name ?? ''),
          last_name: String(p.last_name ?? ''),
          email: String(p.email ?? user?.email ?? ''),
          phone: String(p.phone ?? ''),
          description: String(p.description ?? ''),
          specialization: String(p.specialization ?? ''),
          lead_time_desc: String(p.lead_time_desc ?? ''),
          price_range: String(p.price_range ?? ''),
        });
      })
      .catch((e) => setRootError(getErrorMessage(e, 'โหลดข้อมูลไม่สำเร็จ')))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [form, user?.email, user?.role]);

  const onSubmit = async (values: ProfileEditFormValues) => {
    const currentRole = String(role || user?.role || '');
    const roleError = validateProfileEditForRole(values, currentRole);
    if (roleError) {
      setRootError(roleError);
      return;
    }
    setRootError('');
    try {
      const payload = isFactory
        ? {
            phone: values.phone,
            email: values.email,
            description: values.description,
            specialization: values.specialization,
            lead_time_desc: values.lead_time_desc,
            price_range: values.price_range,
          }
        : {
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            email: values.email,
          };
      await profileApi.update(payload);
      navigate('/profile');
    } catch (e) {
      setRootError(getErrorMessage(e, 'บันทึกไม่สำเร็จ'));
    }
  };

  const fieldRows: Array<{ label: string; name: keyof ProfileEditFormValues }> = isFactory
    ? [
        { label: 'รายละเอียดโรงงาน', name: 'description' },
        { label: 'ความเชี่ยวชาญ', name: 'specialization' },
        { label: 'Lead Time', name: 'lead_time_desc' },
        { label: 'ช่วงราคา', name: 'price_range' },
      ]
    : [
        { label: 'ชื่อ', name: 'first_name' },
        { label: 'นามสกุล', name: 'last_name' },
      ];

  if (loading) return <div className='p-4 text-sm text-gray-500'>กำลังโหลด...</div>;

  return (
    <div className='space-y-4 pb-24'>
      <div className='border-b border-gray-200 bg-white p-4 flex items-center justify-between'>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => navigate(-1)}
          className='text-gray-600 hover:text-gray-900'
        >
          <ChevronLeft size={18} />
        </Button>
        <p className='text-sm font-bold text-gray-900'>แก้ไขโปรไฟล์</p>
        <Button
          variant='unstyled'
          type='button'
          onClick={() => void form.handleSubmit(onSubmit)()}
          disabled={form.formState.isSubmitting}
          className='px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-brand-purple hover:bg-brand-violet-deep disabled:opacity-50 transition-colors'
        >
          {form.formState.isSubmitting ? '...' : 'บันทึก'}
        </Button>
      </div>

      {rootError ? <ErrorAlert size='sm'>{rootError}</ErrorAlert> : null}

      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className='rounded-lg border border-gray-200 bg-white p-4 space-y-3'
        >
          <div className='flex items-center gap-3'>
            <Image
              src={profileAvatarSrc}
              alt='avatar'
              className='h-14 w-14 rounded-lg bg-gray-100 object-cover'
            />
            <p className='text-xs text-slate-500'>
              รูปโปรไฟล์ถูกสร้างอัตโนมัติจากบัญชีของคุณ
            </p>
          </div>

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs text-slate-500'>อีเมล</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type='email'
                    autoComplete='email'
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs text-slate-500'>เบอร์โทร</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {fieldRows.map(({ label, name }) => (
            <FormField
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs text-slate-500'>{label}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </form>
      </Form>
    </div>
  );
}
