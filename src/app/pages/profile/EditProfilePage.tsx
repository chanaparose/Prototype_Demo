import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { profileApi } from '@/services/api/userApi';
import { useAuth } from '@/stores/useAuthStore';
import {
  profileEditFormSchema,
  validateProfileEditForRole,
  type ProfileEditFormValues,
} from '@/domain/profile/schemas/profileEditForm.schema';
import { getErrorMessage } from '@/lib/apiError';
import { useQuery } from '@tanstack/react-query';
import { useAppMutation } from '@/hooks/useAppMutation';
import { applyFormErrorsFromApi } from '@/lib/apiError';
import { asRecord } from '@/lib/apiShape';
import { APP_ROUTES } from '@/constants/routes';
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
  const { user } = useAuth();
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

  const profileQuery = useQuery({
    queryKey: ['profile', 'edit'],
    queryFn: () => profileApi.get(),
    staleTime: 0,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    const p = profileQuery.data;
    const addr = asRecord(p.address);
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
  }, [profileQuery.data, form, user?.role]);

  useEffect(() => {
    if (profileQuery.error) {
      setRootError(getErrorMessage(profileQuery.error, 'โหลดข้อมูลไม่สำเร็จ'));
    }
  }, [profileQuery.error]);

  const saveMutation = useAppMutation({
    mutationFn: async (values: ProfileEditFormValues) => {
      if (avatarFile) await profileApi.uploadAvatar(avatarFile);
      await profileApi.update({ ...values, bio: values.bio.slice(0, 300) });
    },
    fallbackMessage: 'บันทึกไม่สำเร็จ',
    onMutate: () => setRootError(''),
    onError: (err) => applyFormErrorsFromApi(err, form.setError, ['root']),
    onSuccess: () => navigate(APP_ROUTES.profile),
  });

  const onSubmit = async (values: ProfileEditFormValues) => {
    const currentRole = String(role || user?.role || '');
    const roleError = validateProfileEditForRole(values, currentRole);
    if (roleError) {
      setRootError(roleError);
      return;
    }
    await saveMutation.mutateAsync(values);
  };

  const loading = profileQuery.isLoading;

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
          onClick={() => void form.handleSubmit(onSubmit)()}
          disabled={saveMutation.isPending}
          className='text-xs font-semibold text-indigo-600 disabled:opacity-50'
        >
          บันทึก
        </Button>
      </div>

      {rootError ? <ErrorAlert size='sm'>{rootError}</ErrorAlert> : null}

      <Form {...form}>
        <form
          onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
          className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3'
        >
          <div className='flex items-center gap-3'>
            <Image
              src={avatarPreview || '/assets/avatars/customer-default.svg'}
              alt='avatar'
              className='w-14 h-14 rounded-2xl object-cover bg-slate-100'
            />
            <FormLabel className='text-xs font-semibold text-indigo-600 cursor-pointer'>
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
            </FormLabel>
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
                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
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
                      className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
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
                    className='w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
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
