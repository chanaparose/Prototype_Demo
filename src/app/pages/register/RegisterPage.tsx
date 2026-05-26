import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  Factory,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@lib/utils';
import { z } from 'zod';
import { useAuth } from '@/stores/useAuthStore';
import { useRegisterFactory } from '@/pages/auth/useRegisterFactory';
import { ApiHttpError } from '@/services/api/httpClient';
import { getErrorMessage } from '@/lib/apiError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Image } from '@/components/ui/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mediaApi } from '@/services/api/factoryApi';
import { checkEmail } from '@/services/api/authApi';

/* ─────────────────────────────────────────────────── */
/* Schemas                                             */
/* ─────────────────────────────────────────────────── */

const ctSchema = z
  .object({
    first_name: z.string().trim().min(1, 'กรุณากรอกชื่อ'),
    last_name: z.string().trim().min(1, 'กรุณากรอกนามสกุล'),
    email: z.string().trim().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
    phone: z.string().trim().min(9, 'กรุณากรอกเบอร์โทรศัพท์').max(15, 'เบอร์โทรศัพท์ไม่ถูกต้อง'),
    password: z.string().trim().min(8, 'รหัสผ่านอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().trim().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  });

type CtFormValues = z.infer<typeof ctSchema>;

/* ─────────────────────────────────────────────────── */
/* Shared UI helpers                                   */
/* ─────────────────────────────────────────────────── */

const inputBase =
  'w-full rounded-xl border bg-white/95 px-4 py-2.5 text-sm text-[var(--brand-navy)] placeholder:text-[var(--neutral-placeholder)] outline-none transition-all shadow-[0_1px_2px_rgba(46,34,82,0.04)]';
const inputNormal =
  'border-[var(--brand-lavender-muted)] focus:border-[var(--brand-mauve)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--brand-mauve)_20%,transparent)]';
const inputError =
  'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100';

const PRIMARY_BTN =
  'w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-60 transition-all active:scale-[0.99] shadow-[0_6px_20px_rgba(79,70,229,0.28)]';
const PRIMARY_BTN_BG = {
  background: 'linear-gradient(135deg, var(--brand-mauve) 0%, var(--brand-purple) 100%)',
} as const;

function inClass(err?: string) {
  return cn(inputBase, err ? inputError : inputNormal);
}

function FormAlert({
  children,
  tone = 'error',
}: {
  children: React.ReactNode;
  tone?: 'error' | 'warning';
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-2xl border px-4 py-3 text-xs leading-relaxed',
        tone === 'error'
          ? 'border-red-200/80 bg-red-50 text-red-800'
          : 'border-amber-200/80 bg-amber-50 text-amber-900',
      )}
      role='alert'
    >
      <AlertCircle size={14} className='mt-0.5 shrink-0' />
      <span>{children}</span>
    </div>
  );
}

function SectionHeading({ num, label }: { num: number; label: string }) {
  return (
    <div className='mb-4 flex items-center gap-2.5'>
      <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-lavender)] text-[11px] font-bold text-[var(--brand-purple)]'>
        {num}
      </span>
      <h3 className='text-sm font-bold text-[var(--brand-navy)]'>{label}</h3>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/* CT Tab                                              */
/* ─────────────────────────────────────────────────── */

function CustomerTab() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [apiError, setApiError] = useState('');

  const form = useForm<CtFormValues>({
    resolver: zodResolver(ctSchema),
    defaultValues: { first_name: '', last_name: '', email: '', phone: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: CtFormValues) => {
    setApiError('');
    try {
      await register({
        role: 'CT',
        email: values.email,
        phone: values.phone,
        password: values.password,
        first_name: values.first_name,
        last_name: values.last_name,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setApiError(getErrorMessage(err, 'สมัครสมาชิกไม่สำเร็จ'));
    }
  };

  return (
    <div className='space-y-4'>
      {apiError ? <FormAlert>{apiError}</FormAlert> : null}

      <Form {...form}>
        <form onSubmit={(e) => void form.handleSubmit(onSubmit)(e)} className='space-y-3' noValidate>
          <div className='grid grid-cols-2 gap-3'>
            <FormField
              control={form.control}
              name='first_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-medium text-[var(--brand-navy)]/80'>
                    ชื่อ <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='ชื่อ'
                      autoComplete='given-name'
                      className={inClass(form.formState.errors.first_name?.message)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='last_name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-xs font-medium text-[var(--brand-navy)]/80'>
                    นามสกุล <span className='text-red-500'>*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='นามสกุล'
                      autoComplete='family-name'
                      className={inClass(form.formState.errors.last_name?.message)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='text-xs' />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs font-medium text-gray-600'>
                  อีเมล <span className='text-red-500'>*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='email@example.com'
                    autoComplete='email'
                    className={inClass(form.formState.errors.email?.message)}
                    {...field}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='phone'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs font-medium text-gray-600'>
                  เบอร์โทรศัพท์ <span className='text-red-500'>*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type='tel'
                    placeholder='08x-xxx-xxxx'
                    autoComplete='tel'
                    className={inClass(form.formState.errors.phone?.message)}
                    {...field}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs font-medium text-gray-600'>
                  รหัสผ่าน <span className='text-red-500'>*</span>
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showPw ? 'text' : 'password'}
                      placeholder='อย่างน้อย 8 ตัวอักษร'
                      autoComplete='new-password'
                      className={`${inClass(form.formState.errors.password?.message)} pr-10`}
                      {...field}
                    />
                    <Button
                      variant='unstyled'
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowPw((v) => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-xs font-medium text-gray-600'>
                  ยืนยันรหัสผ่าน <span className='text-red-500'>*</span>
                </FormLabel>
                <FormControl>
                  <div className='relative'>
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder='กรอกรหัสผ่านอีกครั้ง'
                      autoComplete='new-password'
                      className={`${inClass(form.formState.errors.confirmPassword?.message)} pr-10`}
                      {...field}
                    />
                    <Button
                      variant='unstyled'
                      type='button'
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <Button
            variant='unstyled'
            type='submit'
            disabled={isSubmitting}
            className={cn(PRIMARY_BTN, 'mt-2')}
            style={PRIMARY_BTN_BG}
          >
            {isSubmitting ? <><Loader2 size={16} className='animate-spin' />กำลังสมัคร...</> : 'สมัครสมาชิก'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/* FT Tab                                              */
/* ─────────────────────────────────────────────────── */

type UpgradeStep = 'form' | 'verify-password' | 'done';

function FactoryTab() {
  const navigate = useNavigate();
  const { login, register, user, isAuthenticated } = useAuth();

  // True when a logged-in CT user is upgrading their existing account to FT
  const isCTUpgrade = isAuthenticated && String(user?.role ?? '').toUpperCase() === 'CT';

  const {
    form,
    errors,
    factoryTypes,
    provinces,
    lbiCategories,
    lbiSubCategories,
    certTypes,
    masterLoading,
    masterFailed,
    retryMaster,
    submitting,
    apiError: factoryApiError,
    setField,
    blurField,
    validateAll,
    setFieldRef,
  } = useRegisterFactory();

  // Pre-fill account fields from session when upgrading CT→FT
  useEffect(() => {
    if (isCTUpgrade && user) {
      if (user.email) setField('email', user.email);
      if (user.phone) setField('phone', user.phone);
    }
  }, [isCTUpgrade, user, setField]);

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Upgrade flow (for guest who enters an existing CT email)
  const [upgradeStep, setUpgradeStep] = useState<UpgradeStep>('form');
  const [upgradeEmail, setUpgradeEmail] = useState('');
  const [upgradePassword, setUpgradePassword] = useState('');
  const [showUpgradePw, setShowUpgradePw] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);
  // Stash FT form data for re-submission after password verification
  const [pendingFtData, setPendingFtData] = useState<Parameters<typeof register>[0] | null>(null);

  // Email on-blur existence check
  type EmailStatus = 'idle' | 'checking' | 'ct' | 'ft' | 'free';
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const lastCheckedEmail = React.useRef('');

  const handleEmailBlur = React.useCallback(async () => {
    blurField('email');
    const email = form.email.trim();
    // Skip if invalid format or already checked the same email
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email) || email === lastCheckedEmail.current) return;
    lastCheckedEmail.current = email;
    setEmailStatus('checking');
    try {
      const result = await checkEmail(email);
      if (!result.exists) {
        setEmailStatus('free');
      } else if (result.role === 'CT') {
        setEmailStatus('ct');
        // Jump straight to verify-password step — no need to fill the whole form first
        setUpgradeEmail(email);
        setUpgradeStep('verify-password');
      } else {
        // FT or any other registered role already exists
        setEmailStatus('ft');
      }
    } catch {
      setEmailStatus('idle'); // silently ignore network errors
    }
  }, [form.email, blurField, setUpgradeEmail, setUpgradeStep]);

  const isProcessing = submitting || localSubmitting;

  const handleSubmit = async () => {
    setApiError(null);
    if (!validateAll()) return;
    setLocalSubmitting(true);

    // For CT upgrade: email comes from the authenticated session, not the form
    const resolvedEmail = isCTUpgrade && user?.email ? user.email : form.email.trim();

    try {
      const certUrl = form.cert_file ? (await mediaApi.upload(form.cert_file)).url : '';
      const ftPayload = {
        role: 'FT' as const,
        email: resolvedEmail,
        phone: form.phone.replace(/\s/g, ''),
        password: form.password,
        factory_name: form.factory_name.trim(),
        factory_type_id: form.factory_type_id,
        tax_id: form.tax_id.replace(/\D/g, ''),
        province_id: form.province_id || undefined,
        category_ids: form.category_ids,
        sub_category_ids: form.sub_category_ids,
        cert_id: form.cert_id,
        document_url: certUrl,
        cert_number: form.cert_number.trim() || undefined,
        cert_expire_date: form.cert_expire_date || undefined,
      };

      await register(ftPayload);
      navigate('/factory', { replace: true });
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 409) {
        // Email already exists as CT — offer upgrade
        setPendingFtData({
          role: 'FT' as const,
          email: resolvedEmail,
          phone: form.phone.replace(/\s/g, ''),
          password: form.password,
          factory_name: form.factory_name.trim(),
          factory_type_id: form.factory_type_id,
          tax_id: form.tax_id.replace(/\D/g, ''),
          province_id: form.province_id || undefined,
          category_ids: form.category_ids,
          sub_category_ids: form.sub_category_ids,
          cert_id: form.cert_id,
          document_url: '',
          cert_number: form.cert_number.trim() || undefined,
          cert_expire_date: form.cert_expire_date || undefined,
        });
        setUpgradeEmail(resolvedEmail);
        setUpgradeStep('verify-password');
      } else {
        setApiError(getErrorMessage(err, 'เกิดข้อผิดพลาด กรุณาลองใหม่'));
      }
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleUpgrade = async () => {
    if (!upgradePassword || !pendingFtData) return;
    setUpgradeError('');
    setUpgradeSubmitting(true);
    try {
      // 1. Verify CT credentials
      await login({ email: upgradeEmail, password: upgradePassword });
      // 2. Re-submit FT registration (backend should handle CT→FT upgrade)
      await register({ ...pendingFtData, password: upgradePassword });
      navigate('/factory', { replace: true });
    } catch (err) {
      if (err instanceof ApiHttpError && err.status === 401) {
        setUpgradeError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่');
      } else {
        setUpgradeError(getErrorMessage(err, 'อัปเกรดบัญชีไม่สำเร็จ กรุณาลองใหม่'));
      }
    } finally {
      setUpgradeSubmitting(false);
    }
  };

  /* ── Upgrade: verify password step ── */
  if (upgradeStep === 'verify-password') {
    return (
      <div className='space-y-5'>
        <div className='rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-white px-5 py-4 text-sm shadow-[0_4px_16px_rgba(245,158,11,0.08)]'>
          <div className='flex items-start gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100'>
              <ShieldCheck size={20} className='text-amber-700' />
            </span>
            <div>
              <p className='font-semibold text-amber-800'>อีเมลนี้มีบัญชีลูกค้าอยู่แล้ว</p>
              <p className='mt-1 text-xs text-amber-700 leading-relaxed'>
                <span className='font-medium'>{upgradeEmail}</span> ถูกใช้เป็นบัญชีลูกค้าแล้ว
                กรอกรหัสผ่านของบัญชีนั้นเพื่อยืนยันตัวตนและอัปเกรดเป็นบัญชีโรงงาน
              </p>
            </div>
          </div>
        </div>

        {upgradeError ? <FormAlert>{upgradeError}</FormAlert> : null}

        <div className='space-y-3'>
          <Label className='text-xs font-medium text-gray-600'>
            รหัสผ่านบัญชีปัจจุบัน <span className='text-red-500'>*</span>
          </Label>
          <div className='relative'>
            <Input
              type={showUpgradePw ? 'text' : 'password'}
              value={upgradePassword}
              onChange={(e) => setUpgradePassword(e.target.value)}
              placeholder='รหัสผ่านบัญชีลูกค้าของคุณ'
              autoComplete='current-password'
              className={`${inputBase} ${inputNormal} pr-10`}
            />
            <Button
              variant='unstyled'
              type='button'
              tabIndex={-1}
              onClick={() => setShowUpgradePw((v) => !v)}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
            >
              {showUpgradePw ? <EyeOff size={16} /> : <Eye size={16} />}
            </Button>
          </div>
        </div>

        <div className='flex gap-3'>
          <Button
            variant='unstyled'
            type='button'
            onClick={() => {
              setUpgradeStep('form');
              setUpgradePassword('');
              setUpgradeError('');
              setEmailStatus('idle');
              lastCheckedEmail.current = '';
            }}
            className='flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors'
          >
            ย้อนกลับ
          </Button>
          <Button
            variant='unstyled'
            type='button'
            disabled={!upgradePassword || upgradeSubmitting}
            onClick={() => void handleUpgrade()}
            className='flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-60 transition-all'
            style={{ background: 'linear-gradient(135deg, #F59E0B, #D97706)' }}
          >
            {upgradeSubmitting ? (
              <><Loader2 size={15} className='animate-spin' />กำลังยืนยัน...</>
            ) : (
              <>
                <ShieldCheck size={15} />
                ยืนยันและอัปเกรด
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  /* ── Factory registration form ── */
  return (
    <div className='space-y-6'>
      {(apiError ?? factoryApiError) ? <FormAlert>{apiError ?? factoryApiError}</FormAlert> : null}

      {masterFailed ? (
        <FormAlert tone='warning'>
          <span className='flex flex-1 flex-wrap items-center gap-x-2 gap-y-1'>
            <span>โหลดข้อมูลไม่สำเร็จ</span>
            <Button
              variant='unstyled'
              type='button'
              onClick={retryMaster}
              className='font-semibold text-amber-900 underline'
            >
              ลองใหม่
            </Button>
          </span>
        </FormAlert>
      ) : null}

      {/* Section 1: ข้อมูลธุรกิจ */}
      <div>
        <SectionHeading num={1} label='ข้อมูลธุรกิจ' />
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div ref={setFieldRef('factory_name')} className='sm:col-span-2 space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
              ชื่อโรงงาน / บริษัท <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='text'
              maxLength={150}
              value={form.factory_name}
              onChange={(e) => setField('factory_name', e.target.value)}
              onBlur={() => blurField('factory_name')}
              className={inClass(errors.factory_name)}
              placeholder='เช่น บริษัท เอบีซี แมนูแฟคเจอริ่ง จำกัด'
            />
            {errors.factory_name && <p className='text-xs text-red-600'>{errors.factory_name}</p>}
          </div>

          <div ref={setFieldRef('factory_type_id')} className='space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
              ประเภทโรงงาน <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={form.factory_type_id ? String(form.factory_type_id) : ''}
              onValueChange={(v) => {
                const id = v === '__empty' ? 0 : Number(v);
                setField('factory_type_id', id, { validate: true });
              }}
              disabled={masterLoading}
            >
              <SelectTrigger className={inClass(errors.factory_type_id)}>
                <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกประเภท —'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='__empty'>— เลือกประเภท —</SelectItem>
                {factoryTypes.map((t) => (
                  <SelectItem key={t.factory_type_id} value={String(t.factory_type_id)}>
                    {t.name_th}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.factory_type_id && <p className='text-xs text-red-600'>{errors.factory_type_id}</p>}
          </div>

          <div ref={setFieldRef('tax_id')} className='space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
              เลขประจำตัวผู้เสียภาษี <span className='text-red-500'>*</span>
            </Label>
            <Input
              type='text'
              inputMode='numeric'
              maxLength={13}
              value={form.tax_id}
              onChange={(e) => setField('tax_id', e.target.value.replace(/\D/g, '').slice(0, 13))}
              onBlur={() => blurField('tax_id')}
              className={inClass(errors.tax_id)}
              placeholder='เลข 13 หลัก'
            />
            {errors.tax_id && <p className='text-xs text-red-600'>{errors.tax_id}</p>}
          </div>

          <div ref={setFieldRef('province_id')} className='sm:col-span-2 space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
              จังหวัดที่ตั้งโรงงาน <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={form.province_id ? String(form.province_id) : ''}
              onValueChange={(v) => {
                const id = v === '__empty' ? 0 : Number(v);
                setField('province_id', id, { validate: true });
              }}
              disabled={masterLoading}
            >
              <SelectTrigger className={inClass(errors.province_id)}>
                <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกจังหวัด —'} />
              </SelectTrigger>
              <SelectContent className='max-h-64'>
                <SelectItem value='__empty'>— เลือกจังหวัด —</SelectItem>
                {provinces.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.province_id && <p className='text-xs text-red-600'>{errors.province_id}</p>}
          </div>
        </div>
      </div>

      <div className='h-px bg-[var(--brand-lavender-muted)]/80' />

      {/* Section 2: บัญชีผู้ดูแลระบบ */}
      <div>
        <SectionHeading num={2} label='บัญชีผู้ดูแลระบบ' />

        {isCTUpgrade ? (
          /* ── CT upgrade mode: email is locked to the session account ── */
          <div className='space-y-4'>
            {/* Account identity banner */}
            <div className='flex items-start gap-3 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-3.5'>
              <div className='mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600'>
                <ShieldCheck size={16} />
              </div>
              <div className='min-w-0'>
                <p className='text-xs font-semibold text-indigo-800'>อัปเกรดบัญชีนี้เป็นบัญชีโรงงาน</p>
                <p className='mt-0.5 truncate text-sm font-bold text-indigo-900'>{user?.email}</p>
                <p className='mt-0.5 text-[11px] text-indigo-500'>
                  ข้อมูลโรงงานจะผูกกับบัญชีนี้ — ไม่สามารถเปลี่ยนอีเมลได้ระหว่างอัปเกรด
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Phone — pre-filled but editable */}
              <div ref={setFieldRef('phone')} className='space-y-1.5 sm:col-span-2'>
                <Label className='text-xs font-medium text-gray-600'>
                  เบอร์โทรศัพท์ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  type='tel'
                  autoComplete='tel'
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                  onBlur={() => blurField('phone')}
                  className={inClass(errors.phone)}
                  placeholder='081-234-5678'
                />
                {errors.phone && <p className='text-xs text-red-600'>{errors.phone}</p>}
                <p className='text-[11px] text-gray-400'>เบอร์โทรที่ใช้ติดต่อธุรกิจ (แก้ไขได้)</p>
              </div>

              {/* Verify current password — identity confirmation */}
              <div ref={setFieldRef('password')} className='space-y-1.5 sm:col-span-2'>
                <Label className='text-xs font-medium text-gray-600'>
                  ยืนยันรหัสผ่านบัญชีปัจจุบัน <span className='text-red-500'>*</span>
                </Label>
                <div className='relative'>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    autoComplete='current-password'
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    onBlur={() => blurField('password')}
                    className={`${inClass(errors.password)} pr-10`}
                    placeholder='กรอกรหัสผ่านเดิมของคุณ'
                  />
                  <Button
                    variant='unstyled'
                    type='button'
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                {errors.password && <p className='text-xs text-red-600'>{errors.password}</p>}
                <p className='text-[11px] text-gray-400'>
                  ใช้เพื่อยืนยันตัวตนก่อนอัปเกรดบัญชี ไม่ใช่การตั้งรหัสใหม่
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ── Guest mode: full account section ── */
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div ref={setFieldRef('email')} className='space-y-1.5 sm:col-span-2'>
              <Label className='text-xs font-medium text-gray-600'>
                อีเมล <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <Input
                  type='email'
                  autoComplete='email'
                  value={form.email}
                  onChange={(e) => {
                    setField('email', e.target.value);
                    // Reset status when user edits the email
                    if (e.target.value.trim() !== lastCheckedEmail.current) {
                      setEmailStatus('idle');
                    }
                  }}
                  onBlur={() => void handleEmailBlur()}
                  className={inClass(errors.email)}
                  placeholder='owner@factory.com'
                />
                {emailStatus === 'checking' && (
                  <Loader2 size={14} className='absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400' />
                )}
                {emailStatus === 'free' && (
                  <CheckCircle2 size={14} className='absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500' />
                )}
              </div>
              {errors.email && <p className='text-xs text-red-600'>{errors.email}</p>}
              {/* Inline email-exists hints (only shown when no format error) */}
              {!errors.email && emailStatus === 'ft' && (
                <div className='flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800'>
                  <AlertCircle size={13} className='mt-0.5 shrink-0 text-red-500' />
                  <span>
                    อีเมลนี้ลงทะเบียนเป็นโรงงานแล้ว{' '}
                    <Link to='/login' className='font-semibold underline'>
                      เข้าสู่ระบบ
                    </Link>{' '}
                    หรือใช้อีเมลอื่น
                  </span>
                </div>
              )}
            </div>

            <div ref={setFieldRef('phone')} className='space-y-1.5'>
              <Label className='text-xs font-medium text-gray-600'>
                เบอร์โทรศัพท์ <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='tel'
                autoComplete='tel'
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                onBlur={() => blurField('phone')}
                className={inClass(errors.phone)}
                placeholder='081-234-5678'
              />
              {errors.phone && <p className='text-xs text-red-600'>{errors.phone}</p>}
            </div>

            <div ref={setFieldRef('password')} className='space-y-1.5'>
              <Label className='text-xs font-medium text-gray-600'>
                รหัสผ่าน <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <Input
                  type={showPw ? 'text' : 'password'}
                  autoComplete='new-password'
                  value={form.password}
                  onChange={(e) => setField('password', e.target.value)}
                  onBlur={() => blurField('password')}
                  className={`${inClass(errors.password)} pr-10`}
                  placeholder='8 ตัวอักษรขึ้นไป'
                />
                <Button
                  variant='unstyled'
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {errors.password && <p className='text-xs text-red-600'>{errors.password}</p>}
            </div>

            <div ref={setFieldRef('confirmPassword')} className='space-y-1.5'>
              <Label className='text-xs font-medium text-gray-600'>
                ยืนยันรหัสผ่าน <span className='text-red-500'>*</span>
              </Label>
              <div className='relative'>
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete='new-password'
                  value={form.confirmPassword}
                  onChange={(e) => setField('confirmPassword', e.target.value)}
                  onBlur={() => blurField('confirmPassword')}
                  className={`${inClass(errors.confirmPassword)} pr-10`}
                  placeholder='กรอกอีกครั้ง'
                />
                <Button
                  variant='unstyled'
                  type='button'
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400'
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {errors.confirmPassword && <p className='text-xs text-red-600'>{errors.confirmPassword}</p>}
            </div>
          </div>
        )}
      </div>

      <div className='h-px bg-[var(--brand-lavender-muted)]/80' />

      {/* Section 3: หมวดหมู่สินค้า */}
      <div>
        <SectionHeading num={3} label='หมวดหมู่สินค้าที่รับผลิต' />
        <p className='mb-3 text-xs text-gray-400'>เลือกอย่างน้อย 1 หมวด — ระบบจะจับคู่กับ RFQ ลูกค้า</p>

        {masterLoading ? (
          <div className='flex items-center gap-2 py-4 text-sm text-gray-400'>
            <Loader2 size={14} className='animate-spin' />
            กำลังโหลดหมวดหมู่...
          </div>
        ) : (
          <div ref={setFieldRef('category_ids')} className='space-y-3'>
            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
              {lbiCategories.map((cat) => {
                const selected = form.category_ids.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={cn(
                      'flex cursor-pointer select-none items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-all',
                      selected
                        ? 'border-[var(--brand-mauve)] bg-[var(--brand-lavender)] font-semibold text-[var(--brand-purple)] shadow-[0_2px_8px_rgba(79,70,229,0.12)]'
                        : 'border-[var(--brand-lavender-muted)] text-[var(--neutral-subtle)] hover:border-[var(--brand-mauve)]/40 hover:bg-white',
                    )}
                  >
                    <input
                      type='checkbox'
                      className='sr-only'
                      checked={selected}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...form.category_ids, cat.id]
                          : form.category_ids.filter((id) => id !== cat.id);
                        setField('category_ids', next, { validate: true });
                        if (!e.target.checked) {
                          const subIds = (lbiSubCategories[cat.id] ?? []).map((s) => s.id);
                          if (subIds.length > 0) {
                            setField(
                              'sub_category_ids',
                              form.sub_category_ids.filter((id) => !subIds.includes(id)),
                            );
                          }
                        }
                      }}
                    />
                    <CheckCircle2
                      size={13}
                      className={selected ? 'text-[var(--brand-purple)]' : 'text-[var(--brand-lavender-muted)]'}
                    />
                    {cat.name}
                  </label>
                );
              })}
            </div>

            {form.category_ids.some((id) => {
              const cat = lbiCategories.find((c) => c.id === id);
              return cat?.scope !== 'MT' && (lbiSubCategories[id] ?? []).length > 0;
            }) && (
              <div className='space-y-3 rounded-2xl border border-[var(--brand-lavender-muted)] bg-[var(--brand-page)]/60 p-4'>
                <p className='text-[10px] font-bold uppercase tracking-wide text-[var(--brand-mauve)]'>
                  หมวดย่อย (เลือกเพิ่มเติม)
                </p>
                {lbiCategories
                  .filter(
                    (cat) =>
                      cat.scope !== 'MT' &&
                      form.category_ids.includes(cat.id) &&
                      (lbiSubCategories[cat.id] ?? []).length > 0,
                  )
                  .map((cat) => (
                    <div key={`sub-${cat.id}`}>
                      <p className='mb-2 text-xs font-medium text-gray-500'>{cat.name}</p>
                      <div className='flex flex-wrap gap-1.5'>
                        {(lbiSubCategories[cat.id] ?? []).map((sub) => {
                          const sel = form.sub_category_ids.includes(sub.id);
                          return (
                            <label
                              key={sub.id}
                              className={cn(
                                'inline-flex cursor-pointer select-none items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all',
                                sel
                                  ? 'border-[var(--brand-purple)] bg-[var(--brand-purple)] font-semibold text-white shadow-sm'
                                  : 'border-[var(--brand-lavender-muted)] bg-white text-[var(--neutral-subtle)] hover:border-[var(--brand-mauve)] hover:text-[var(--brand-purple)]',
                              )}
                            >
                              <input
                                type='checkbox'
                                className='sr-only'
                                checked={sel}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...form.sub_category_ids, sub.id]
                                    : form.sub_category_ids.filter((id) => id !== sub.id);
                                  setField('sub_category_ids', next);
                                }}
                              />
                              {sub.name}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {errors.category_ids && <p className='text-xs text-red-600'>{errors.category_ids}</p>}
          </div>
        )}
      </div>

      <div className='h-px bg-[var(--brand-lavender-muted)]/80' />

      {/* Section 4: เอกสารยืนยันตัวตน */}
      <div>
        <SectionHeading num={4} label='เอกสารยืนยันตัวตนโรงงาน' />
        <p className='mb-4 text-xs text-gray-400'>
          อัปโหลดใบรับรองอย่างน้อย 1 ใบ (GMP, ISO, อย. ฯลฯ)
        </p>

        <div className='space-y-4 rounded-2xl border border-[var(--brand-lavender-muted)] bg-[var(--brand-page)]/50 p-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div ref={setFieldRef('cert_id')} className='space-y-1.5'>
              <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
                ประเภทใบรับรอง <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={form.cert_id ? String(form.cert_id) : ''}
                onValueChange={(v) => {
                  const id = v === '__empty' ? 0 : Number(v);
                  setField('cert_id', id, { validate: true });
                }}
                disabled={masterLoading}
              >
                <SelectTrigger className={inClass(errors.cert_id)}>
                  <SelectValue placeholder={masterLoading ? 'กำลังโหลด...' : '— เลือกประเภท —'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='__empty'>— เลือกประเภท —</SelectItem>
                  {certTypes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.cert_id && <p className='text-xs text-red-600'>{errors.cert_id}</p>}
            </div>

            <div ref={setFieldRef('cert_expire_date')} className='space-y-1.5'>
              <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
                วันหมดอายุเอกสาร <span className='text-red-500'>*</span>
              </Label>
              <Input
                type='date'
                value={form.cert_expire_date}
                onChange={(e) => setField('cert_expire_date', e.target.value)}
                onBlur={() => blurField('cert_expire_date')}
                className={inClass(errors.cert_expire_date)}
              />
              {errors.cert_expire_date && <p className='text-xs text-red-600'>{errors.cert_expire_date}</p>}
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>เลขที่เอกสาร (ถ้ามี)</Label>
            <Input
              type='text'
              value={form.cert_number}
              onChange={(e) => setField('cert_number', e.target.value)}
              className={inClass()}
              placeholder='เช่น GMP-123456'
            />
          </div>

          <div ref={setFieldRef('cert_file')} className='space-y-1.5'>
            <Label className='text-xs font-medium text-[var(--brand-navy)]/80'>
              ไฟล์เอกสาร (รูปภาพหรือ PDF) <span className='text-red-500'>*</span>
            </Label>
            <input
              type='file'
              accept='image/*,.pdf'
              className='w-full cursor-pointer text-xs text-[var(--neutral-subtle)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-lavender)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--brand-purple)] hover:file:bg-[var(--brand-lavender-muted)]'
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setField('cert_file', f, { validate: true });
              }}
            />
            {form.cert_file && (
              <p className='flex items-center gap-1 text-xs text-emerald-600'>
                <CheckCircle2 size={11} />
                {form.cert_file.name}
              </p>
            )}
            {errors.cert_file && <p className='text-xs text-red-600'>{errors.cert_file}</p>}
          </div>
        </div>
      </div>

      {/* Terms */}
      <div
        ref={setFieldRef('acceptTerms')}
        className='rounded-2xl border border-[var(--brand-lavender-muted)] bg-[var(--brand-lavender)]/30 p-4'
      >
        <Label className='flex cursor-pointer items-start gap-3 text-xs text-[var(--brand-navy)]'>
          <Checkbox
            checked={form.acceptTerms}
            onCheckedChange={(checked) => setField('acceptTerms', checked === true)}
            onBlur={() => blurField('acceptTerms')}
            className='mt-0.5'
          />
          <span className='leading-relaxed'>
            ข้าพเจ้ายอมรับ{' '}
            <a href='#' className='font-semibold text-[var(--brand-purple)] hover:underline'>
              ข้อตกลงและเงื่อนไขการใช้บริการ
            </a>{' '}
            และนโยบายความเป็นส่วนตัว
          </span>
        </Label>
        {errors.acceptTerms && <p className='text-xs text-red-600 pl-7 mt-1.5'>{errors.acceptTerms}</p>}
      </div>

      <Button
        variant='unstyled'
        type='button'
        disabled={isProcessing || masterLoading}
        onClick={() => void handleSubmit()}
        className={cn(PRIMARY_BTN, 'py-3.5')}
        style={PRIMARY_BTN_BG}
      >
        {isProcessing ? (
          <><Loader2 size={16} className='animate-spin' />กำลังดำเนินการ...</>
        ) : isCTUpgrade ? (
          <><ShieldCheck size={16} />อัปเกรดเป็นบัญชีโรงงาน</>
        ) : (
          'สมัครและส่งข้อมูลเพื่อรับการอนุมัติ'
        )}
      </Button>
    </div>
  );
}

/* ─────────────────────────────────────────────────── */
/* RegisterPage — step 1: role · step 2: form          */
/* ─────────────────────────────────────────────────── */

type RegisterRole = 'ct' | 'ft';
type RegisterStep = 'choose-role' | 'form';

const ROLE_OPTIONS: {
  id: RegisterRole;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
}[] = [
  {
    id: 'ct',
    icon: User,
    title: 'ลูกค้า',
    description: 'ขอใบเสนอราคา สั่งผลิต และติดตามโครงการกับโรงงาน',
  },
  {
    id: 'ft',
    icon: Factory,
    title: 'โรงงาน / ผู้ผลิต',
    description: 'รับ RFQ จากลูกค้า เสนอราคา และจัดการคำสั่งซื้อ',
  },
];

function parseInitialRole(tab: string | null): RegisterRole | null {
  if (tab === 'ft') return 'ft';
  if (tab === 'ct') return 'ct';
  return null;
}

function RegisterStepper({ step }: { step: RegisterStep }) {
  const step1Done = step === 'form';
  return (
    <ol className='mb-6 flex items-center justify-center gap-2 sm:gap-3' aria-label='ขั้นตอนการสมัคร'>
      <li
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs',
          step1Done
            ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
            : 'bg-[var(--brand-lavender)] text-[var(--brand-purple)] ring-1 ring-[var(--brand-lavender-muted)]',
        )}
      >
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
            step1Done ? 'bg-emerald-600 text-white' : 'bg-[var(--brand-purple)] text-white',
          )}
        >
          {step1Done ? '✓' : '1'}
        </span>
        เลือกบทบาท
      </li>
      <li className='h-px w-6 sm:w-10 bg-[var(--brand-lavender-muted)]' aria-hidden />
      <li
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold sm:text-xs',
          step === 'form'
            ? 'bg-[var(--brand-lavender)] text-[var(--brand-purple)] ring-1 ring-[var(--brand-lavender-muted)]'
            : 'bg-white/80 text-[var(--neutral-placeholder)] ring-1 ring-[var(--brand-lavender-muted)]/60',
        )}
      >
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
            step === 'form' ? 'bg-[var(--brand-purple)] text-white' : 'bg-[var(--brand-lavender-muted)] text-white',
          )}
        >
          2
        </span>
        กรอกข้อมูล
      </li>
    </ol>
  );
}

function RoleSelectionStep({
  selected,
  onSelect,
  onContinue,
}: {
  selected: RegisterRole | null;
  onSelect: (role: RegisterRole) => void;
  onContinue: () => void;
}) {
  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col py-2 sm:py-4'>
      <p className='text-center text-base font-bold text-[var(--brand-navy)] sm:text-lg'>
        เลือกประเภทบัญชีของคุณ
      </p>
      <p className='mx-auto mt-1.5 max-w-md text-center text-xs leading-relaxed text-[var(--neutral-subtle)]'>
        แตะการ์ดเพื่อเลือก — จากนั้นกดถัดไปเพื่อกรอกแบบฟอร์ม
      </p>

      <div className='mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'>
        {ROLE_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          const Icon = opt.icon;
          return (
            <Button
              key={opt.id}
              variant='unstyled'
              type='button'
              onClick={() => onSelect(opt.id)}
              className={cn(
                'relative flex flex-col items-center rounded-2xl border-2 px-5 py-8 text-center transition-all duration-200',
                active
                  ? 'border-[var(--brand-purple)] shadow-[0_14px_36px_rgba(79,70,229,0.16)] ring-4 ring-[color-mix(in_srgb,var(--brand-mauve)_14%,transparent)]'
                  : 'border-[var(--brand-lavender-muted)] bg-white hover:border-[color-mix(in_srgb,var(--brand-mauve)_45%,var(--brand-lavender-muted))] hover:shadow-[0_8px_24px_rgba(46,34,82,0.08)]',
              )}
              style={
                active
                  ? {
                      background:
                        'linear-gradient(180deg, color-mix(in srgb, var(--brand-lavender) 55%, white) 0%, white 100%)',
                    }
                  : undefined
              }
            >
              <span
                className={cn(
                  'mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                  active
                    ? 'bg-white shadow-[0_4px_14px_rgba(79,70,229,0.12)]'
                    : 'bg-[var(--brand-lavender)]/80',
                )}
              >
                <Icon
                  size={32}
                  className={active ? 'text-[var(--brand-purple)]' : 'text-[var(--brand-mauve)]'}
                />
              </span>
              <p className='text-[15px] font-bold text-[var(--brand-navy)]'>{opt.title}</p>
              <p className='mt-2 text-xs leading-relaxed text-[var(--neutral-subtle)]'>
                {opt.description}
              </p>
              {active ? (
                <span className='mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-purple)]'>
                  เลือกแล้ว
                  <ArrowRight size={14} strokeWidth={2.5} />
                </span>
              ) : (
                <span className='mt-4 text-[11px] text-[var(--neutral-placeholder)]'>แตะเพื่อเลือก</span>
              )}
            </Button>
          );
        })}
      </div>

      <Button
        variant='unstyled'
        type='button'
        disabled={!selected}
        onClick={onContinue}
        className={cn(PRIMARY_BTN, 'mx-auto mt-8 w-full max-w-xs sm:max-w-sm')}
        style={PRIMARY_BTN_BG}
      >
        ถัดไป
        <ArrowRight size={16} />
      </Button>
    </div>
  );
}

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  // CT user who wants to upgrade their account to FT
  const isCTUpgrade = isAuthenticated && String(user?.role ?? '').toUpperCase() === 'CT';

  const initialRole = isCTUpgrade ? 'ft' : parseInitialRole(searchParams.get('tab'));
  const [step, setStep] = useState<RegisterStep>(initialRole ? 'form' : 'choose-role');
  const [role, setRole] = useState<RegisterRole | null>(initialRole);

  return (
    <div
      className='relative flex min-h-screen items-start justify-center overflow-hidden px-4 py-6 md:py-10'
      style={{
        background:
          'linear-gradient(180deg, var(--brand-lavender) 0%, var(--brand-page) 48%, var(--neutral-white) 100%)',
      }}
    >
      <div
        className='pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full opacity-50 blur-3xl'
        style={{ background: 'var(--brand-violet-soft)' }}
      />
      <div
        className='pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full opacity-40 blur-3xl'
        style={{ background: 'color-mix(in srgb, var(--brand-orange-deep) 25%, var(--brand-lavender))' }}
      />

      <div
        className={cn(
          'relative z-10 w-full',
          step === 'form' && role === 'ft' ? 'max-w-[1040px]' : 'max-w-[980px]',
        )}
      >
        <div className='flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-[0_24px_64px_rgba(46,34,82,0.12)] backdrop-blur-md'>
            <header className='border-b border-[var(--brand-lavender-muted)]/60 px-5 pb-4 pt-5 sm:px-8 sm:pt-6'>
              <div className='mb-4 flex items-center justify-between gap-3'>
                <Image
                  src='/assets/tryly-logo.png'
                  alt='Tryly'
                  className='h-9 w-auto object-contain'
                />
                <Link
                  to='/login'
                  className='text-xs font-semibold text-[var(--brand-purple)] hover:underline'
                >
                  เข้าสู่ระบบ
                </Link>
              </div>

              <div>
                {isCTUpgrade ? (
                  /* CT upgrade: back = go home (not choose-role, they're already logged in) */
                  <Link
                    to='/'
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neutral-subtle)] transition-colors hover:text-[var(--brand-purple)]'
                  >
                    <ArrowLeft size={14} />
                    ยกเลิก — กลับหน้าแรก
                  </Link>
                ) : step === 'form' ? (
                  <Button
                    variant='unstyled'
                    type='button'
                    onClick={() => setStep('choose-role')}
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neutral-subtle)] transition-colors hover:text-[var(--brand-purple)]'
                  >
                    <ArrowLeft size={14} />
                    เปลี่ยนประเภทบัญชี
                  </Button>
                ) : (
                  <Link
                    to='/'
                    className='inline-flex items-center gap-1.5 text-xs font-medium text-[var(--neutral-subtle)] transition-colors hover:text-[var(--brand-purple)]'
                  >
                    <ArrowLeft size={14} />
                    กลับหน้าแรก
                  </Link>
                )}
              </div>

              <h2 className='mt-3 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl'>
                {isCTUpgrade
                  ? 'อัปเกรดบัญชีเป็นโรงงาน'
                  : step === 'choose-role'
                    ? 'สมัครสมาชิก'
                    : role === 'ct'
                      ? 'สมัครบัญชีลูกค้า'
                      : 'สมัครบัญชีโรงงาน'}
              </h2>
              <p className='mt-1 text-xs text-[var(--neutral-subtle)]'>
                {isCTUpgrade
                  ? `เพิ่มข้อมูลโรงงานเพื่ออัปเกรด ${user?.email ?? ''}`
                  : step === 'choose-role'
                    ? 'เริ่มต้นใช้งาน Tryly — เลือกบทบาทก่อนกรอกข้อมูล'
                    : role === 'ct'
                      ? 'กรอกข้อมูลส่วนตัวเพื่อขอใบเสนอราคาและใช้งานแพลตฟอร์ม'
                      : 'กรอกข้อมูลธุรกิจและเอกสารเพื่อรับการอนุมัติ'}
              </p>
            </header>

            <div className='flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6'>
              {/* Stepper only shown for new registrations, not CT→FT upgrades */}
              {!isCTUpgrade && <RegisterStepper step={step} />}
              {step === 'choose-role' ? (
                <RoleSelectionStep
                  selected={role}
                  onSelect={setRole}
                  onContinue={() => {
                    if (role) setStep('form');
                  }}
                />
              ) : role === 'ct' ? (
                <CustomerTab />
              ) : role === 'ft' ? (
                <FactoryTab />
              ) : null}
            </div>
        </div>
      </div>
    </div>
  );
}
