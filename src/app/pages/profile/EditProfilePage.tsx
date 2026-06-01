import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { profileApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import { useDataStore } from '@/stores/useDataStore';
import {
  profileEditFormSchema,
  validateProfileEditForRole,
  type ProfileEditFormValues,
} from '@/domain/profile/schemas/profileEditForm.schema';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

const emptyValues: ProfileEditFormValues = {
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
};

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const patchCurrentUser = useDataStore((s) => s.patchCurrentUser);
  const [loading, setLoading] = useState(true);
  const [rootError, setRootError] = useState('');
  const [role, setRole] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: emptyValues,
    mode: 'onSubmit',
  });

  const bioLength = form.watch('bio').length;
  const isFactory = String(role || user?.role || '').toUpperCase() === 'FT';

  useEffect(() => {
    let mounted = true;
    void profileApi
      .get()
      .then((p) => {
        if (!mounted) return;
        const addr = (p.address ?? {}) as Record<string, unknown>;
        setAvatarPreview(String(p.avatar_url ?? ''));
        setRole(String(p.role ?? user?.role ?? ''));
        form.reset({
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
      .catch((e) => setRootError(getErrorMessage(e, 'โหลดข้อมูลไม่สำเร็จ')))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [form, user?.role]);

  const onSubmit = async (values: ProfileEditFormValues) => {
    const currentRole = String(role || user?.role || '');
    const roleError = validateProfileEditForRole(values, currentRole);
    if (roleError) {
      setRootError(roleError);
      return;
    }
    setRootError('');
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const uploadRes = await profileApi.uploadAvatar(avatarFile);
        avatarUrl = String(
          uploadRes.avatar_url ?? (uploadRes as Record<string, unknown>).avatar_url ?? '',
        ).trim() || undefined;
      }
      const updateData: Record<string, unknown> = { ...values, bio: values.bio.slice(0, 300) };
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }
      await profileApi.update(updateData);
      if (avatarUrl) {
        patchCurrentUser({ avatar: avatarUrl });
      }
      await refreshUser();
      navigate('/profile');
    } catch (e) {
      setRootError(getErrorMessage(e, 'บันทึกไม่สำเร็จ'));
    }
  };

  const fieldRows: Array<{ label: string; name: keyof ProfileEditFormValues }> = isFactory
    ? [
        { label: 'รายละเอียดโรงงาน', name: 'description' },
        { label: 'ความเชี่ยวชาญ', name: 'specialization' },
        { label: 'ขั้นต่ำการผลิต (MOQ)', name: 'min_order' },
        { label: 'Lead Time', name: 'lead_time_desc' },
        { label: 'ช่วงราคา', name: 'price_range' },
      ]
    : [
        { label: 'ชื่อ', name: 'first_name' },
        { label: 'นามสกุล', name: 'last_name' },
        { label: 'บ้านเลขที่/ถนน', name: 'address_line1' },
        { label: 'ตำบล/แขวง', name: 'sub_district' },
        { label: 'อำเภอ/เขต', name: 'district' },
        { label: 'จังหวัด', name: 'province' },
        { label: 'รหัสไปรษณีย์', name: 'postal_code' },
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
              src={avatarPreview || '/assets/avatars/customer-default.svg'}
              alt='avatar'
              className='w-14 h-14 rounded-lg object-cover bg-gray-100'
            />
            <label className='text-xs font-semibold text-brand-purple cursor-pointer hover:text-brand-violet-deep transition-colors'>
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

          <FormField
            control={form.control}
            name='bio'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs text-slate-500'>บันทึกย่อ</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.slice(0, 300))}
                    rows={3}
                    className='w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-none focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple'
                  />
                </FormControl>
                <p className='text-[11px] text-slate-400 text-right'>{bioLength}/300</p>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
